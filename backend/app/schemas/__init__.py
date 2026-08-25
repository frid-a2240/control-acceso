"""Registro de schemas Pydantic."""
from app.schemas.auth import Token, TokenData, LoginRequest
from app.schemas.usuario import UsuarioCreate, UsuarioOut
from app.schemas.empresa import EmpresaCreate, EmpresaOut
from app.schemas.persona import PersonaCreate, PersonaOut, PersonaUpdate, VehiculoAlta
from app.schemas.vehiculo import PersonaBreve, VehiculoOut
from app.schemas.visita import (
    VisitaCreate, VisitaOut, VisitaResumen, VisitaResolucion,
)

__all__ = [
    "Token", "TokenData", "LoginRequest",
    "UsuarioCreate", "UsuarioOut",
    "EmpresaCreate", "EmpresaOut",
    "PersonaCreate", "PersonaOut", "PersonaUpdate", "VehiculoAlta",
    "PersonaBreve", "VehiculoOut",
    "VisitaCreate", "VisitaOut", "VisitaResumen", "VisitaResolucion",
]