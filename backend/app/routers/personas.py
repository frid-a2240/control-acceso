"""Módulo Usuarios — personas visitantes recurrentes.

Cuando el guardia captura una nueva visita, busca por INE (o por nombre) y
elige de la lista de coincidencias. Al seleccionarla, sus placas registradas
vienen incluidas para que no haya que buscarlas a mano ni ligarlas por error
a otra persona.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_encargado
from app.database import get_db
from app.models.persona import Persona
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.persona import PersonaCreate, PersonaOut, PersonaUpdate, VehiculoAlta
from app.schemas.vehiculo import VehiculoOut
from app.services.media import guardar_foto_base64


router = APIRouter(prefix="/api/personas", tags=["personas"])


def _registrar_vehiculo_de(db: Session, persona: Persona, data: VehiculoAlta) -> Vehiculo:
    """Da de alta las placas a nombre de `persona`.

    Las placas son únicas en todo el sistema: si ya existen y son de otra
    persona se rechaza el alta, para que no queden ligadas al visitante
    equivocado.
    """
    placas = data.placas.upper().strip()
    v = db.query(Vehiculo).filter(Vehiculo.placas == placas).first()

    if v is None:
        v = Vehiculo(marca=data.marca.strip(), modelo=data.modelo.strip(), placas=placas)
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
    _: Usuario = Depends(get_current_user),
):
    """Búsqueda parcial por nombre o número de identificación.

    Con 2-3 caracteres ya devuelve coincidencias — es lo que alimenta el
    dropdown del buscador en 'Nueva Solicitud'.
    """
    query = db.query(Persona)
    if q:
        patron = f"%{q.strip()}%"
        query = query.filter(
            (Persona.nombre.ilike(patron))
            | (Persona.numero_identificacion.ilike(patron))
        )
    return query.order_by(Persona.nombre).limit(50).all()


@router.get("/buscar-ine/{numero}", response_model=PersonaOut)
def buscar_por_ine(
    numero: str,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Autocompletado exacto por número de identificación."""
    p = db.query(Persona).filter(Persona.numero_identificacion == numero).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no registrada")
    return p


@router.get("/{persona_id}", response_model=PersonaOut)
def obtener_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    return p


@router.post("", response_model=PersonaOut, status_code=status.HTTP_201_CREATED)
def crear_persona(
    data: PersonaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Registra una persona nueva junto con las placas que trae.

    Si ya existe con el mismo INE, la reutiliza y le agrega las placas del
    payload. Unas placas que ya son de otra persona se rechazan (409).
    """
    p = (
        db.query(Persona)
        .filter(Persona.numero_identificacion == data.numero_identificacion.strip())
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
    _: Usuario = Depends(get_current_user),
):
    """Registra placas adicionales a una persona ya registrada.

    Es el caso de 'esta vez trae otro carro': las placas quedan guardadas y
    la próxima visita ya salen las dos. Si esas placas ya son de alguien más
    se rechaza (409) en vez de ligarlas al visitante equivocado.
    """
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    v = _registrar_vehiculo_de(db, p, data)
    p.vehiculos.append(v)

    db.commit()
    db.refresh(v)
    return v


@router.delete("/{persona_id}/vehiculos/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def quitar_vehiculo_de_persona(
    persona_id: int,
    vehiculo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Desliga las placas de la persona. El vehículo sigue existiendo."""
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    v = next((x for x in p.vehiculos if x.id == vehiculo_id), None)
    if v is None:
        raise HTTPException(status_code=404, detail="Esa persona no tiene ligadas esas placas")

    p.vehiculos.remove(v)
    db.commit()


@router.delete("/{persona_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_persona(
    persona_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_encargado),
):
    """Borra una persona (uso temporal mientras el sistema está en pruebas).

    Si tiene solicitudes de visita asociadas se rechaza con 409: hay que
    borrar primero esas solicitudes para no perder el historial ligado.
    """
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    try:
        db.delete(p)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                f"No se puede borrar a {p.nombre}: tiene solicitudes de visita "
                "asociadas. Borra primero esas solicitudes."
            ),
        )


@router.patch("/{persona_id}", response_model=PersonaOut)
def actualizar_persona(
    persona_id: int,
    data: PersonaUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    p = db.query(Persona).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

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
