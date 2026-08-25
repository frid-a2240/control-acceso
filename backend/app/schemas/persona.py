"""Schemas del módulo 'Usuarios' (personas visitantes)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.vehiculo import VehiculoOut


class VehiculoAlta(BaseModel):
    """Placas que se dan de alta junto con la persona, en el mismo paso."""
    marca: str = Field(min_length=2, max_length=100)
    modelo: str = Field(min_length=1, max_length=50)
    placas: str = Field(min_length=3, max_length=20)


class PersonaCreate(BaseModel):
    nombre: str = Field(min_length=3, max_length=200)
    nacionalidad: str = Field(min_length=2, max_length=50)
    tipo_identificacion: str = Field(default="INE", max_length=20)
    numero_identificacion: str = Field(min_length=3, max_length=50)
    empresa_id: int | None = None
    foto_base64: str | None = None  # data URL o base64 puro; el backend la guarda como archivo
    vehiculos: list[VehiculoAlta] = Field(default_factory=list)


class PersonaUpdate(BaseModel):
    nombre: str | None = None
    nacionalidad: str | None = None
    empresa_id: int | None = None
    foto_base64: str | None = None


class PersonaOut(BaseModel):
    id: int
    nombre: str
    nacionalidad: str
    tipo_identificacion: str
    numero_identificacion: str
    foto_path: str | None
    empresa_id: int | None
    fecha_registro: datetime
    ultima_visita: datetime | None
    vehiculos: list[VehiculoOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
