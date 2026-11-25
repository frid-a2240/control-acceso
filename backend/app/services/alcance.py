"""Quién puede ver cada registro del directorio (personas y vehículos).

Cada solicitante ve solo lo que él registró; OPIP ve todo. Lo ajeno se trata
como inexistente (404), para no revelar siquiera que está registrado.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Query, Session

from app.models.persona import Persona
from app.models.usuario import RolUsuario, Usuario
from app.models.vehiculo import Vehiculo


def visibles(db: Session, modelo: type[Persona] | type[Vehiculo], usuario: Usuario) -> Query:
    """Consulta limitada a lo que `usuario` puede ver."""
    query = db.query(modelo)
    if usuario.rol != RolUsuario.OPIP:
        query = query.filter(modelo.registrado_por_id == usuario.id)
    return query


def persona_o_404(db: Session, persona_id: int, usuario: Usuario) -> Persona:
    p = visibles(db, Persona, usuario).filter(Persona.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    return p
