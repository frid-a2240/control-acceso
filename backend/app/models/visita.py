"""Visitas — solicitudes de acceso temporal (formato PDP-PPIP-F-03).

Una visita puede incluir varias personas y varios vehículos (M2M).
Estados: pendiente → aprobada / rechazada.
"""
from datetime import datetime, date
from enum import Enum as PyEnum

from sqlalchemy import (
    String, DateTime, Date, Integer, Text, Enum,
    ForeignKey, Table, Column,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EstadoVisita(str, PyEnum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"


# ---------- Tablas de asociación many-to-many ----------

visita_personas = Table(
    "visita_personas",
    Base.metadata,
    Column("visita_id", ForeignKey("visitas.id", ondelete="CASCADE"), primary_key=True),
    Column("persona_id", ForeignKey("personas.id"), primary_key=True),
)

visita_vehiculos = Table(
    "visita_vehiculos",
    Base.metadata,
    Column("visita_id", ForeignKey("visitas.id", ondelete="CASCADE"), primary_key=True),
    Column("vehiculo_id", ForeignKey("vehiculos.id"), primary_key=True),
)


# ---------- Modelo principal ----------

class Visita(Base):
    __tablename__ = "visitas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    folio: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)

    # ---- Datos del formato PDP-PPIP-F-03 ----
    empresa_solicitante: Mapped[str] = mapped_column(String(200), nullable=False)
    justificacion: Mapped[str] = mapped_column(String(300), nullable=False)
    persona_a_visitar: Mapped[str] = mapped_column(String(150), nullable=False)
    area_a_visitar: Mapped[str] = mapped_column(String(150), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    duracion_horas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duracion_dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    horario: Mapped[str] = mapped_column(String(50), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ---- Flujo de aprobación ----
    estado: Mapped[EstadoVisita] = mapped_column(
        Enum(EstadoVisita, name="estado_visita"),
        default=EstadoVisita.PENDIENTE,
        nullable=False,
        index=True,
    )
    guardia_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios_sistema.id"), nullable=False
    )
    encargado_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios_sistema.id"), nullable=True
    )
    comentario_resolucion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ---- Timestamps ----
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    fecha_resolucion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # ---- Relaciones ----
    guardia: Mapped["Usuario"] = relationship(foreign_keys=[guardia_id])
    encargado: Mapped["Usuario | None"] = relationship(foreign_keys=[encargado_id])
    personas: Mapped[list["Persona"]] = relationship(secondary=visita_personas, lazy="selectin")
    vehiculos: Mapped[list["Vehiculo"]] = relationship(secondary=visita_vehiculos, lazy="selectin")