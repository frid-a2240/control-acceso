"""Visitas — solicitudes de acceso (creación, listados, aprobación/rechazo)."""
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.auth import (
    get_current_user, require_guardia_u_opip, require_opip, require_solicitante,
)
from app.database import get_db
from app.models.persona import Persona
from app.models.usuario import Usuario, RolUsuario
from app.models.vehiculo import Vehiculo
from app.models.visita import Visita, EstadoVisita
from app.schemas.visita import (
    VisitaCreate, VisitaOut, VisitaResumen, VisitaResolucion, VisitaVigente,
)
from app.services.alcance import visibles
from app.services.empresas import registrar_empresa
from app.services.notificaciones import avisar_resolucion, avisar_solicitud_nueva
from app.services.vigencia import (
    JORNADA_INICIO, limite_para_aprobar, plazo_al_aprobar, proxima_ventana,
    texto_horario, ventana_actual,
)


router = APIRouter(prefix="/api/visitas", tags=["visitas"])


# ---------- Utilidades internas ----------

def _generar_folio(db: Session) -> str:
    """Folio secuencial anual: AC-2026-0001, AC-2026-0002, ...

    Se calcula a partir del último folio existente (no de un conteo de filas)
    para que borrar solicitudes de prueba no genere folios duplicados: si se
    borran todas las del año, el siguiente folio vuelve a 0001; si solo se
    borran algunas, el contador sigue después del folio más alto que quede.
    """
    year = datetime.now().year
    prefijo = f"AC-{year}-"
    ultimo = (
        db.query(Visita.folio)
        .filter(Visita.folio.like(f"{prefijo}%"))
        .order_by(Visita.folio.desc())
        .first()
    )
    siguiente = int(ultimo[0].rsplit("-", 1)[-1]) + 1 if ultimo else 1
    return f"{prefijo}{siguiente:04d}"


# ---------- Endpoints del solicitante ----------

@router.post("", response_model=VisitaOut, status_code=status.HTTP_201_CREATED)
def crear_visita(
    data: VisitaCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    solicitante: Usuario = Depends(require_solicitante),
):
    """El solicitante (coordinador, jefe de área o colaborador) crea una
    nueva solicitud. Se manda a aprobación de OPIP."""
    if not data.persona_ids:
        raise HTTPException(
            status_code=400,
            detail="Debe incluir al menos una persona en la visita",
        )

    if data.fecha_fin < data.fecha_inicio:
        raise HTTPException(
            status_code=400,
            detail="La fecha fin no puede ser anterior a la de inicio",
        )
    limite = limite_para_aprobar(data.fecha_inicio, data.fecha_fin)
    if limite <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="El plazo de la visita ya pasó. Revisa las fechas.",
        )
    # En varios días rige la jornada (08:00 a 17:00): no aplican hora ni horas
    varios_dias = data.fecha_inicio != data.fecha_fin
    if not varios_dias and data.hora_inicio is None:
        raise HTTPException(status_code=400, detail="La hora de llegada es obligatoria")
    hora_inicio = JORNADA_INICIO if varios_dias else data.hora_inicio.replace(tzinfo=None)

    # Solo visitantes y placas registrados por este solicitante
    personas = visibles(db, Persona, solicitante).filter(Persona.id.in_(data.persona_ids)).all()
    if len(personas) != len(data.persona_ids):
        raise HTTPException(status_code=400, detail="Alguna persona no existe")

    vehiculos = []
    if data.vehiculo_ids:
        vehiculos = visibles(db, Vehiculo, solicitante).filter(Vehiculo.id.in_(data.vehiculo_ids)).all()
        if len(vehiculos) != len(data.vehiculo_ids):
            raise HTTPException(status_code=400, detail="Algún vehículo no existe")

    visita = Visita(
        folio=_generar_folio(db),
        empresa_solicitante=data.empresa_solicitante.strip(),
        justificacion=data.justificacion.strip(),
        persona_a_visitar=data.persona_a_visitar.strip(),
        area_a_visitar=data.area_a_visitar.strip(),
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        duracion_horas=None if varios_dias else data.duracion_horas,
        duracion_dias=(data.fecha_fin - data.fecha_inicio).days + 1 if varios_dias else None,
        horario=texto_horario(data.fecha_inicio, data.fecha_fin, hora_inicio),
        hora_inicio=hora_inicio,
        vigente_hasta=limite,
        observaciones=data.observaciones,
        estado=EstadoVisita.PENDIENTE,
        solicitante_id=solicitante.id,
    )
    registrar_empresa(db, visita.empresa_solicitante)
    visita.personas = personas
    visita.vehiculos = vehiculos

    db.add(visita)
    db.commit()
    db.refresh(visita)

    # Marca la última visita en cada persona (para el módulo Usuarios)
    ahora = datetime.utcnow()
    for p in personas:
        p.ultima_visita = ahora
    db.commit()

    # Avisos en background — la respuesta al solicitante sale de inmediato
    background.add_task(avisar_solicitud_nueva, visita.id)

    return visita


@router.get("/mis-solicitudes", response_model=list[VisitaResumen])
def mis_solicitudes(
    db: Session = Depends(get_db),
    solicitante: Usuario = Depends(require_solicitante),
):
    """Historial del solicitante — sus últimas solicitudes con estado actual."""
    resultados = (
        db.query(Visita)
        .filter(Visita.solicitante_id == solicitante.id)
        .order_by(Visita.fecha_creacion.desc())
        .limit(1000)
        .all()
    )
    return [
        VisitaResumen(
            id=v.id,
            folio=v.folio,
            empresa_solicitante=v.empresa_solicitante,
            persona_a_visitar=v.persona_a_visitar,
            estado=v.estado,
            vencida=v.vencida,
            fecha_creacion=v.fecha_creacion,
            total_personas=len(v.personas),
        )
        for v in resultados
    ]


# ---------- Endpoints de OPIP ----------

@router.get("/pendientes", response_model=list[VisitaResumen])
def listar_pendientes(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_opip),
):
    """Bandeja de entrada de OPIP — todas las visitas pendientes."""
    resultados = (
        db.query(Visita)
        .filter(Visita.estado == EstadoVisita.PENDIENTE)
        .order_by(Visita.fecha_creacion.asc())
        .all()
    )
    return [
        VisitaResumen(
            id=v.id,
            folio=v.folio,
            empresa_solicitante=v.empresa_solicitante,
            persona_a_visitar=v.persona_a_visitar,
            estado=v.estado,
            vencida=v.vencida,
            fecha_creacion=v.fecha_creacion,
            total_personas=len(v.personas),
        )
        for v in resultados
    ]


@router.get("/historial", response_model=list[VisitaResumen])
def historial(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_opip),
):
    """Historial — rechazadas y aprobadas cuyo plazo ya terminó."""
    resultados = (
        db.query(Visita)
        .filter(or_(
            Visita.estado == EstadoVisita.RECHAZADA,
            and_(
                Visita.estado == EstadoVisita.APROBADA,
                Visita.vigente_hasta <= datetime.now(),
            ),
        ))
        .order_by(Visita.fecha_resolucion.desc())
        .limit(5000)
        .all()
    )
    return [
        VisitaResumen(
            id=v.id,
            folio=v.folio,
            empresa_solicitante=v.empresa_solicitante,
            persona_a_visitar=v.persona_a_visitar,
            estado=v.estado,
            vencida=v.vencida,
            fecha_creacion=v.fecha_creacion,
            total_personas=len(v.personas),
        )
        for v in resultados
    ]


@router.get("/aprobadas", response_model=list[VisitaVigente])
def listar_aprobadas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_guardia_u_opip),
):
    """Aprobadas dentro de su plazo.

    El guardia ve solo las que tienen acceso hoy; OPIP también las aprobadas
    para días siguientes, para no perderlas de vista hasta que venzan.
    """
    ahora = datetime.now()
    visitas = (
        db.query(Visita)
        .filter(
            Visita.estado == EstadoVisita.APROBADA,
            Visita.vigente_hasta > ahora,
        )
        .all()
    )
    vigentes = []
    for v in visitas:
        solo_hoy = usuario.rol == RolUsuario.GUARDIA
        ventana = ventana_actual(v, ahora) if solo_hoy else proxima_ventana(v, ahora)
        if ventana is None:
            continue
        inicio, fin = ventana
        vigentes.append(VisitaVigente(
            id=v.id,
            folio=v.folio,
            empresa_solicitante=v.empresa_solicitante,
            justificacion=v.justificacion,
            persona_a_visitar=v.persona_a_visitar,
            area_a_visitar=v.area_a_visitar,
            fecha_inicio=v.fecha_inicio,
            fecha_fin=v.fecha_fin,
            inicio=inicio.astimezone(),  # con zona, para que el navegador no la adivine
            fin=fin.astimezone(),
            en_horario=inicio <= ahora,
            personas=v.personas,
            vehiculos=v.vehiculos,
        ))
    return sorted(vigentes, key=lambda x: x.inicio)


@router.post("/{visita_id}/resolver", response_model=VisitaOut)
def resolver_visita(
    visita_id: int,
    resolucion: VisitaResolucion,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    opip: Usuario = Depends(require_opip),
):
    """OPIP aprueba o rechaza. Avisa al solicitante y, si aprueba, a los guardias."""
    visita = db.query(Visita).filter(Visita.id == visita_id).first()
    if not visita:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    if visita.estado != EstadoVisita.PENDIENTE:
        raise HTTPException(
            status_code=400,
            detail=f"La visita ya fue {visita.estado.value}",
        )

    if resolucion.aprobar and visita.vigente_hasta <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="El plazo de esta visita ya venció: no se puede aprobar, solo rechazar",
        )

    visita.estado = EstadoVisita.APROBADA if resolucion.aprobar else EstadoVisita.RECHAZADA
    if resolucion.aprobar:
        visita.vigente_desde, visita.vigente_hasta = plazo_al_aprobar(visita, datetime.now())
    visita.opip_id = opip.id
    visita.comentario_resolucion = resolucion.comentario
    visita.fecha_resolucion = datetime.utcnow()
    db.commit()
    db.refresh(visita)

    background.add_task(avisar_resolucion, visita.id)

    return visita


# ---------- Consulta compartida ----------

@router.get("/{visita_id}", response_model=VisitaOut)
def obtener_visita(
    visita_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Detalle completo — el formato lleno.

    OPIP ve cualquier solicitud; el solicitante solo las que él capturó; el
    guardia solo las aprobadas con acceso hoy.
    """
    v = db.query(Visita).filter(Visita.id == visita_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    if usuario.rol == RolUsuario.SOLICITANTE and v.solicitante_id != usuario.id:
        raise HTTPException(
            status_code=403,
            detail="Solo puedes consultar las solicitudes que tú capturaste",
        )
    if usuario.rol == RolUsuario.GUARDIA and (
        v.estado != EstadoVisita.APROBADA or ventana_actual(v, datetime.now()) is None
    ):
        raise HTTPException(
            status_code=403,
            detail="Esta solicitud no tiene acceso vigente",
        )
    return v