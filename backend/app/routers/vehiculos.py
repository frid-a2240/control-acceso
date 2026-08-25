"""Vehículos — solo consulta.

Las placas siempre se dan de alta a través de su dueño
(`POST /api/personas` o `POST /api/personas/{id}/vehiculos`), para que nunca
queden registradas sin persona ni ligadas al visitante equivocado.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_encargado
from app.database import get_db
from app.models.persona import Persona
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoOut


router = APIRouter(prefix="/api/vehiculos", tags=["vehiculos"])


@router.get("", response_model=list[VehiculoOut])
def listar_vehiculos(
    q: str | None = None,
    persona_id: int | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Búsqueda parcial por placas, marca o modelo.

    Con `persona_id` devuelve solo las placas ligadas a esa persona.
    """
    query = db.query(Vehiculo)
    if q:
        patron = f"%{q.strip()}%"
        query = query.filter(
            Vehiculo.placas.ilike(patron)
            | Vehiculo.marca.ilike(patron)
            | Vehiculo.modelo.ilike(patron)
        )
    if persona_id is not None:
        query = query.filter(Vehiculo.personas.any(Persona.id == persona_id))
    return query.order_by(Vehiculo.placas).limit(50).all()


@router.get("/buscar-placas/{placas}", response_model=VehiculoOut)
def buscar_por_placas(
    placas: str,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Consulta exacta — sirve para saber de quién son unas placas."""
    v = db.query(Vehiculo).filter(Vehiculo.placas == placas.upper().strip()).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no registrado")
    return v


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_vehiculo(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_encargado),
):
    """Borra un vehículo (uso temporal mientras el sistema está en pruebas).

    Si está ligado a alguna solicitud de visita se rechaza con 409.
    """
    v = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    try:
        db.delete(v)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                f"No se pueden borrar las placas {v.placas}: están ligadas a "
                "alguna solicitud de visita. Borra primero esa solicitud."
            ),
        )
