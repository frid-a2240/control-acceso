"""Visitas — solicitudes de acceso (creación, listados, aprobación/rechazo)."""
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_encargado, require_guardia
from app.database import get_db
from app.models.persona import Persona
from app.models.usuario import Usuario, RolUsuario
from app.models.vehiculo import Vehiculo
from app.models.visita import Visita, EstadoVisita
from app.schemas.visita import VisitaCreate, VisitaOut, VisitaResumen, VisitaResolucion
from app.services.email_service import enviar_notificacion_encargado
from app.services.pdf_generator import generar_pdf_visita
from app.services.websocket_manager import manager


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


async def _tarea_generar_pdf_y_notificar(visita_id: int) -> None:
    """Se ejecuta en background después de crear la visita:
    genera el PDF y envía el correo al encargado. No bloquea la respuesta HTTP."""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        visita = db.query(Visita).filter(Visita.id == visita_id).first()
        if not visita:
            return

        pdf_path = generar_pdf_visita(visita)

        await enviar_notificacion_encargado(
            folio=visita.folio,
            empresa=visita.empresa_solicitante,
            persona_a_visitar=visita.persona_a_visitar,
            area=visita.area_a_visitar,
            pdf_path=pdf_path,
        )
    except Exception as exc:
        # Log a consola — no queremos que un fallo de correo bote la app
        print(f"[BG] Falló generación/envío para visita {visita_id}: {exc}")
    finally:
        db.close()


# ---------- Endpoints del guardia ----------

@router.post("", response_model=VisitaOut, status_code=status.HTTP_201_CREATED)
def crear_visita(
    data: VisitaCreate,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    guardia: Usuario = Depends(require_guardia),
):
    """Guardia crea una nueva solicitud. Se manda a aprobación del encargado."""
    if not data.persona_ids:
        raise HTTPException(
            status_code=400,
            detail="Debe incluir al menos una persona en la visita",
        )

    personas = db.query(Persona).filter(Persona.id.in_(data.persona_ids)).all()
    if len(personas) != len(data.persona_ids):
        raise HTTPException(status_code=400, detail="Alguna persona no existe")

    vehiculos = []
    if data.vehiculo_ids:
        vehiculos = db.query(Vehiculo).filter(Vehiculo.id.in_(data.vehiculo_ids)).all()
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
        duracion_horas=data.duracion_horas,
        duracion_dias=data.duracion_dias,
        horario=data.horario.strip(),
        observaciones=data.observaciones,
        estado=EstadoVisita.PENDIENTE,
        guardia_id=guardia.id,
    )
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

    # PDF + correo en background — la respuesta al guardia sale de inmediato
    background.add_task(_tarea_generar_pdf_y_notificar, visita.id)

    return visita


@router.get("/mis-solicitudes", response_model=list[VisitaResumen])
def mis_solicitudes(
    db: Session = Depends(get_db),
    guardia: Usuario = Depends(require_guardia),
):
    """Historial del guardia — sus últimas solicitudes con estado actual."""
    resultados = (
        db.query(Visita)
        .filter(Visita.guardia_id == guardia.id)
        .order_by(Visita.fecha_creacion.desc())
        .limit(100)
        .all()
    )
    return [
        VisitaResumen(
            id=v.id,
            folio=v.folio,
            empresa_solicitante=v.empresa_solicitante,
            persona_a_visitar=v.persona_a_visitar,
            estado=v.estado,
            fecha_creacion=v.fecha_creacion,
            total_personas=len(v.personas),
        )
        for v in resultados
    ]


# ---------- Endpoints del encargado ----------

@router.get("/pendientes", response_model=list[VisitaResumen])
def listar_pendientes(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_encargado),
):
    """Bandeja de entrada del encargado — todas las visitas pendientes."""
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
            fecha_creacion=v.fecha_creacion,
            total_personas=len(v.personas),
        )
        for v in resultados
    ]


@router.get("/historial", response_model=list[VisitaResumen])
def historial(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_encargado),
):
    """Historial completo — todas las visitas resueltas."""
    resultados = (
        db.query(Visita)
        .filter(Visita.estado != EstadoVisita.PENDIENTE)
        .order_by(Visita.fecha_resolucion.desc())
        .limit(200)
        .all()
    )
    return [
        VisitaResumen(
            id=v.id,
            folio=v.folio,
            empresa_solicitante=v.empresa_solicitante,
            persona_a_visitar=v.persona_a_visitar,
            estado=v.estado,
            fecha_creacion=v.fecha_creacion,
            total_personas=len(v.personas),
        )
        for v in resultados
    ]


@router.delete("/{visita_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_visita(
    visita_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_encargado),
):
    """Borra una solicitud (uso temporal mientras el sistema está en pruebas).

    El folio es secuencial por conteo de filas del año (`_generar_folio`),
    así que al borrar visitas el próximo folio generado se reacomoda solo.
    """
    visita = db.query(Visita).filter(Visita.id == visita_id).first()
    if not visita:
        raise HTTPException(status_code=404, detail="Visita no encontrada")

    db.delete(visita)
    db.commit()


@router.post("/{visita_id}/resolver", response_model=VisitaOut)
async def resolver_visita(
    visita_id: int,
    resolucion: VisitaResolucion,
    db: Session = Depends(get_db),
    encargado: Usuario = Depends(require_encargado),
):
    """Encargado aprueba o rechaza. Notifica al guardia vía WebSocket."""
    visita = db.query(Visita).filter(Visita.id == visita_id).first()
    if not visita:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    if visita.estado != EstadoVisita.PENDIENTE:
        raise HTTPException(
            status_code=400,
            detail=f"La visita ya fue {visita.estado.value}",
        )

    visita.estado = EstadoVisita.APROBADA if resolucion.aprobar else EstadoVisita.RECHAZADA
    visita.encargado_id = encargado.id
    visita.comentario_resolucion = resolucion.comentario
    visita.fecha_resolucion = datetime.utcnow()
    db.commit()
    db.refresh(visita)

    # WebSocket → notifica al guardia que creó la visita, en tiempo real
    await manager.notify_guardia(
        visita.guardia_id,
        {
            "type": "visita_resuelta",
            "visita_id": visita.id,
            "folio": visita.folio,
            "estado": visita.estado.value,
            "comentario": visita.comentario_resolucion,
            "fecha_resolucion": visita.fecha_resolucion.isoformat(),
        },
    )

    return visita


# ---------- Consulta compartida ----------

@router.get("/{visita_id}", response_model=VisitaOut)
def obtener_visita(
    visita_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    """Detalle completo — el formato lleno.

    El encargado ve cualquier solicitud; el guardia solo las que él capturó.
    """
    v = db.query(Visita).filter(Visita.id == visita_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Visita no encontrada")
    if usuario.rol == RolUsuario.GUARDIA and v.guardia_id != usuario.id:
        raise HTTPException(
            status_code=403,
            detail="Solo puedes consultar las solicitudes que tú capturaste",
        )
    return v