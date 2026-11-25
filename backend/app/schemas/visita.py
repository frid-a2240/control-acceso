"""Schemas de visitas — el formato PDP-PPIP-F-03 completo."""
from datetime import datetime, date, time

from pydantic import BaseModel, ConfigDict, Field

from app.models.visita import EstadoVisita
from app.schemas.persona import PersonaOut
from app.schemas.vehiculo import VehiculoOut


class VisitaCreate(BaseModel):
    """Payload que envía el solicitante al capturar una solicitud."""
    empresa_solicitante: str = Field(min_length=2, max_length=200)
    justificacion: str = Field(min_length=3, max_length=300)
    persona_a_visitar: str = Field(min_length=3, max_length=150)
    area_a_visitar: str = Field(min_length=2, max_length=150)
    fecha_inicio: date
    fecha_fin: date
    duracion_horas: int | None = Field(default=None, ge=1, le=24)
    # Obligatoria si la visita es de un solo día; en varios días rige la jornada.
    hora_inicio: time | None = None
    observaciones: str | None = None

    persona_ids: list[int] = Field(default_factory=list)
    vehiculo_ids: list[int] = Field(default_factory=list)


class VisitaResolucion(BaseModel):
    """Payload de OPIP al aprobar/rechazar."""
    aprobar: bool
    comentario: str | None = Field(default=None, max_length=500)


class VisitaOut(BaseModel):
    """Detalle completo — para la pantalla de OPIP y la vista del formato."""
    id: int
    folio: str
    empresa_solicitante: str
    justificacion: str
    persona_a_visitar: str
    area_a_visitar: str
    fecha_inicio: date
    fecha_fin: date
    duracion_horas: int | None
    duracion_dias: int | None
    horario: str
    observaciones: str | None
    estado: EstadoVisita
    vencida: bool
    vigente_desde: datetime | None
    vigente_hasta: datetime
    comentario_resolucion: str | None
    fecha_creacion: datetime
    fecha_resolucion: datetime | None
    personas: list[PersonaOut]
    vehiculos: list[VehiculoOut]

    model_config = ConfigDict(from_attributes=True)


class VisitaVigente(BaseModel):
    """Aprobada con acceso permitido hoy — lo que el guardia verifica en la entrada."""
    id: int
    folio: str
    empresa_solicitante: str
    justificacion: str
    persona_a_visitar: str
    area_a_visitar: str
    fecha_inicio: date
    fecha_fin: date
    inicio: datetime
    fin: datetime
    en_horario: bool
    personas: list[PersonaOut]
    vehiculos: list[VehiculoOut]


class VisitaResumen(BaseModel):
    """Vista de lista — más ligera para tablas de historial y pendientes."""
    id: int
    folio: str
    empresa_solicitante: str
    persona_a_visitar: str
    estado: EstadoVisita
    vencida: bool
    fecha_creacion: datetime
    total_personas: int

    model_config = ConfigDict(from_attributes=True)