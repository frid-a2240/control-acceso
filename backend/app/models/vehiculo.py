"""Vehículos registrados — se autocompletan por placas y quedan ligados a su dueño."""
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ---------- Relación persona ↔ vehículo ----------
# Una persona puede traer varias placas y unas placas pueden compartirse
# entre varias personas (vehículo de empresa, por ejemplo).

persona_vehiculos = Table(
    "persona_vehiculos",
    Base.metadata,
    Column("persona_id", ForeignKey("personas.id", ondelete="CASCADE"), primary_key=True),
    Column("vehiculo_id", ForeignKey("vehiculos.id", ondelete="CASCADE"), primary_key=True),
)


class Vehiculo(Base):
    __tablename__ = "vehiculos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    marca: Mapped[str] = mapped_column(String(100), nullable=False)
    modelo: Mapped[str] = mapped_column(String(50), nullable=False)
    placas: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    personas: Mapped[list["Persona"]] = relationship(
        secondary=persona_vehiculos,
        back_populates="vehiculos",
        lazy="selectin",
    )
