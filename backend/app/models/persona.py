"""Personas (visitantes) — módulo Usuarios que autocompleta en visitas subsecuentes."""
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Persona(Base):
    """Visitante registrado. Si ya vino antes, el guardia lo busca por INE
    y todos sus datos se autocompletan — solo manda la solicitud a aprobación."""

    __tablename__ = "personas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    nacionalidad: Mapped[str] = mapped_column(String(50), nullable=False)
    tipo_identificacion: Mapped[str] = mapped_column(String(20), default="INE", nullable=False)
    numero_identificacion: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    foto_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    empresa_id: Mapped[int | None] = mapped_column(ForeignKey("empresas.id"), nullable=True)
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    ultima_visita: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    empresa: Mapped["Empresa | None"] = relationship(back_populates="personas")

    # Placas que esta persona suele traer — se autocompletan en cada visita nueva
    vehiculos: Mapped[list["Vehiculo"]] = relationship(
        secondary="persona_vehiculos",
        back_populates="personas",
        lazy="selectin",
    )