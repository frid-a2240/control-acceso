"""Vehículos registrados — se autocompletan por placas y quedan ligados a su dueño."""
from datetime import datetime

from sqlalchemy import Integer, String, DateTime, ForeignKey, Table, Column, UniqueConstraint
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
    # Como en personas: cada solicitante guarda las placas de sus visitantes.
    __table_args__ = (
        UniqueConstraint("registrado_por_id", "placas", name="uq_vehiculos_dueno_placas"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    marca: Mapped[str] = mapped_column(String(100), nullable=False)
    modelo: Mapped[str] = mapped_column(String(50), nullable=False)
    # Nulo solo en vehículos registrados antes de pedir el año.
    anio: Mapped[int | None] = mapped_column(Integer, nullable=True)
    placas: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    registrado_por_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios_sistema.id"), nullable=True, index=True
    )
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    personas: Mapped[list["Persona"]] = relationship(
        secondary=persona_vehiculos,
        back_populates="vehiculos",
        lazy="selectin",
    )
