"""Schemas de usuarios del sistema (guardias y encargados)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.usuario import RolUsuario


class UsuarioCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    nombre_completo: str = Field(min_length=3, max_length=150)
    email: EmailStr | None = None
    password: str = Field(min_length=6, max_length=100)
    rol: RolUsuario


class UsuarioOut(BaseModel):
    id: int
    username: str
    nombre_completo: str
    email: str | None
    rol: RolUsuario
    activo: bool
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)