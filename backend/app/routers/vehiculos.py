"""Vehículos — solo consulta.

Las placas siempre se dan de alta a través de su dueño
(`POST /api/personas` o `POST /api/personas/{id}/vehiculos`), para que nunca
queden registradas sin persona ni ligadas al visitante equivocado.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import require_captura
from app.database import get_db
from app.models.persona import Persona
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoOut
from app.services.alcance import visibles


router = APIRouter(prefix="/api/vehiculos", tags=["vehiculos"])


@router.get("", response_model=list[VehiculoOut])
def listar_vehiculos(
    q: str | None = None,
    persona_id: int | None = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_captura),
):
    """Búsqueda parcial por placas, marca o modelo.

    Con `persona_id` devuelve solo las placas ligadas a esa persona.
    """
    query = visibles(db, Vehiculo, usuario)
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
    usuario: Usuario = Depends(require_captura),
):
    """Consulta exacta — sirve para saber de quién son unas placas."""
    v = visibles(db, Vehiculo, usuario).filter(Vehiculo.placas == placas.upper().strip()).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no registrado")
    return v
