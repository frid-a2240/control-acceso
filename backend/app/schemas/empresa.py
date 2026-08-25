"""Schemas de empresas proveedoras."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EmpresaCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=200)


class EmpresaOut(BaseModel):
    id: int
    nombre: str
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)