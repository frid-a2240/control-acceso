"""Personas (visitantes) — módulo Usuarios que autocompleta en visitas subsecuentes."""
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Persona(Base):
    """Visitante registrado. Si ya vino antes, el solicitante lo busca por INE
    y todos sus datos se autocompletan — solo manda la solicitud a aprobación."""

    __tablename__ = "personas"
    # La misma identificación puede repetirse entre solicitantes: cada quien
    # guarda sus propios visitantes y no ve los de los demás.
    __table_args__ = (
        UniqueConstraint(
            "registrado_por_id", "numero_identificacion", name="uq_personas_dueno_identificacion"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    nacionalidad: Mapped[str] = mapped_column(String(50), nullable=False)
    tipo_identificacion: Mapped[str] = mapped_column(String(20), default="INE", nullable=False)
    numero_identificacion: Mapped[str] = mapped_column(
        String(50), index=True, nullable=False
    )
    foto_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    empresa_id: Mapped[int | None] = mapped_column(ForeignKey("empresas.id"), nullable=True)
    # Nulo solo en registros anteriores sin dueño conocido: los ve OPIP.
    registrado_por_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios_sistema.id"), nullable=True, index=True
    )
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    ultima_visita: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    empresa: Mapped["Empresa | None"] = relationship(back_populates="personas")
    registrado_por: Mapped["Usuario | None"] = relationship(lazy="selectin")

    @property
    def registrado_por_nombre(self) -> str | None:
        return self.registrado_por.nombre_completo if self.registrado_por else None

    # Placas que esta persona suele traer — se autocompletan en cada visita nueva
    vehiculos: Mapped[list["Vehiculo"]] = relationship(
        secondary="persona_vehiculos",
        back_populates="personas",
        lazy="selectin",
    )