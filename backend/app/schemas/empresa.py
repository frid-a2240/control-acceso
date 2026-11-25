"""Schemas de empresas proveedoras."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EmpresaOut(BaseModel):
    id: int
    nombre: str
    fecha_creacion: datetime

    model_config = ConfigDict(from_attributes=True)