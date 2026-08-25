"""Schemas de vehículos."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PersonaBreve(BaseModel):
    """Dueño de las placas — lo mínimo para que el guardia verifique a quién pertenecen.

    Vive aquí (y no en schemas/persona.py) para evitar el import circular:
    PersonaOut ya incluye sus vehículos.
    """
    id: int
    nombre: str
    numero_identificacion: str

    model_config = ConfigDict(from_attributes=True)


class VehiculoOut(BaseModel):
    id: int
    marca: str
    modelo: str
    placas: str
    fecha_registro: datetime
    personas: list[PersonaBreve] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
