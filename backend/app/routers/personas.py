"""Módulo Usuarios — personas visitantes recurrentes.

Cuando el solicitante captura una nueva visita, busca por INE (o por nombre) y
elige de la lista de coincidencias, que incluye solo a quienes él registró. Al seleccionarla, sus placas registradas
vienen incluidas para que no haya que buscarlas a mano ni ligarlas por error
a otra persona.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import require_captura
from app.database import get_db
from app.models.persona import Persona
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.persona import PersonaCreate, PersonaOut, PersonaUpdate, VehiculoAlta
from app.schemas.vehiculo import VehiculoOut
from app.services.alcance import persona_o_404, visibles
from app.services.media import guardar_foto_base64


router = APIRouter(prefix="/api/personas", tags=["personas"])


def _registrar_vehiculo_de(db: Session, persona: Persona, data: VehiculoAlta) -> Vehiculo:
    """Da de alta las placas a nombre de `persona`.

    Las placas son únicas entre los visitantes de cada solicitante: si ya son
    de otro de sus visitantes se rechaza el alta, para que no queden ligadas al
    equivocado. Lo que registraron otros solicitantes no cuenta ni se revela.
    """
    placas = data.placas.upper().strip()
    v = (
        db.query(Vehiculo)
        .filter(
            Vehiculo.placas == placas,
            Vehiculo.registrado_por_id == persona.registrado_por_id,
        )
        .first()
    )

    if v is None:
        v = Vehiculo(
            marca=data.marca.strip(),
            modelo=data.modelo.strip(),
            anio=data.anio,
            placas=placas,
            registrado_por_id=persona.registrado_por_id,
        )
        db.add(v)
        db.flush()
        return v

    if any(p.id == persona.id for p in v.personas):
        raise HTTPException(
            status_code=409,
            detail=f"{persona.nombre} ya tiene registradas las placas {placas}.",
        )

    if v.personas:
        duenos = ", ".join(p.nombre for p in v.personas)
        raise HTTPException(
            status_code=409,
            detail=(
                f"Las placas {placas} ya están registradas y pertenecen a {duenos}. "
                "Verifica el dato o captura otras placas."
            ),
        )

    return v  # placas sin dueño (registro viejo) — se pueden adoptar


@router.get("", response_model=list[PersonaOut])
def listar_personas(
    q: str | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_captura),
):
    """Búsqueda parcial por nombre o número de identificación.

    Con 2-3 caracteres ya devuelve coincidencias — es lo que alimenta el
    dropdown del buscador en 'Nueva Solicitud'.
    """
    query = visibles(db, Persona, usuario)
    if q:
        patron = f"%{q.strip()}%"
        query = query.filter(
            (Persona.nombre.ilike(patron))
            | (Persona.numero_identificacion.ilike(patron))
        )
    query = query.order_by(Persona.nombre)
    # El buscador solo necesita unas cuantas; el directorio las muestra todas
    return query.limit(50).all() if q else query.all()


@router.get("/buscar-ine/{numero}", response_model=PersonaOut)
def buscar_por_ine(
    numero: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_captura),
):
    """Autocompletado exacto por número de identificación."""
    p = visibles(db, Persona, usuario).filter(Persona.numero_identificacion == numero).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no registrada")
    return p


@router.get("/{persona_id}", response_model=PersonaOut)
def obtener_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_captura),
):
    p = persona_o_404(db, persona_id, usuario)
    return p


@router.post("", response_model=PersonaOut, status_code=status.HTTP_201_CREATED)
def crear_persona(
    data: PersonaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_captura),
):
    """Registra una persona nueva junto con las placas que trae.

    Si este usuario ya la tiene con el mismo INE, la reutiliza y le agrega las placas del
    payload. Unas placas que ya son de otra persona se rechazan (409).
    """
    p = (
        db.query(Persona)
        .filter(
            Persona.numero_identificacion == data.numero_identificacion.strip(),
            Persona.registrado_por_id == usuario.id,
        )
        .first()
    )

    if p is None:
        foto_path = guardar_foto_base64(data.foto_base64) if data.foto_base64 else None
        p = Persona(
            nombre=data.nombre.strip(),
            nacionalidad=data.nacionalidad.strip(),
            tipo_identificacion=data.tipo_identificacion,
            numero_identificacion=data.numero_identificacion.strip(),
            foto_path=foto_path,
            empresa_id=data.empresa_id,
            registrado_por_id=usuario.id,
        )
        db.add(p)
        db.flush()

    for alta in data.vehiculos:
        p.vehiculos.append(_registrar_vehiculo_de(db, p, alta))

    db.commit()
    db.refresh(p)
    return p


@router.post(
    "/{persona_id}/vehiculos",
    response_model=VehiculoOut,
    status_code=status.HTTP_201_CREATED,
)
def agregar_vehiculo_a_persona(
    persona_id: int,
    data: VehiculoAlta,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_captura),
):
    """Registra placas adicionales a una persona ya registrada.

    Es el caso de 'esta vez trae otro carro': las placas quedan guardadas y
    la próxima visita ya salen las dos. Si esas placas ya son de alguien más
    se rechaza (409) en vez de ligarlas al visitante equivocado.
    """
    p = persona_o_404(db, persona_id, usuario)

    v = _registrar_vehiculo_de(db, p, data)
    p.vehiculos.append(v)

    db.commit()
    db.refresh(v)
    return v


@router.patch("/{persona_id}", response_model=PersonaOut)
def actualizar_persona(
    persona_id: int,
    data: PersonaUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_captura),
):
    p = persona_o_404(db, persona_id, usuario)

    if data.nombre is not None:
        p.nombre = data.nombre.strip()
    if data.nacionalidad is not None:
        p.nacionalidad = data.nacionalidad.strip()
    if data.empresa_id is not None:
        p.empresa_id = data.empresa_id
    if data.foto_base64:
        nueva = guardar_foto_base64(data.foto_base64)
        if nueva:
            p.foto_path = nueva

    db.commit()
    db.refresh(p)
    return p
