"""Visitas — solicitudes de acceso temporal (formato PDP-PPIP-F-03).

Una visita puede incluir varias personas y varios vehículos (M2M).
Estados: pendiente → aprobada / rechazada.
El solicitante (coordinador, jefe de área o colaborador) captura la
solicitud; OPIP la aprueba o la rechaza cuando la persona llega.
"""
from datetime import datetime, date, time
from enum import Enum as PyEnum

from sqlalchemy import (
    String, DateTime, Date, Time, Integer, Text, Enum,
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
    hora_inicio: Mapped[time] = mapped_column(Time, nullable=False)
    # Hora local. Mientras está pendiente es el límite para aprobarla; al
    # aprobar se fija el plazo real y al vencer pasa de Aprobadas al historial.
    vigente_hasta: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    vigente_desde: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ---- Flujo de aprobación ----
    estado: Mapped[EstadoVisita] = mapped_column(
        Enum(EstadoVisita, name="estado_visita"),
        default=EstadoVisita.PENDIENTE,
        nullable=False,
        index=True,
    )
    solicitante_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios_sistema.id"), nullable=False
    )
    opip_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios_sistema.id"), nullable=True
    )
    comentario_resolucion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ---- Timestamps ----
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )
    fecha_resolucion: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    @property
    def vencida(self) -> bool:
        """Aprobada cuyo plazo ya terminó."""
        return self.estado == EstadoVisita.APROBADA and self.vigente_hasta <= datetime.now()

    # ---- Relaciones ----
    solicitante: Mapped["Usuario"] = relationship(foreign_keys=[solicitante_id])
    opip: Mapped["Usuario | None"] = relationship(foreign_keys=[opip_id])
    personas: Mapped[list["Persona"]] = relationship(secondary=visita_personas, lazy="selectin")
    vehiculos: Mapped[list["Vehiculo"]] = relationship(secondary=visita_vehiculos, lazy="selectin")