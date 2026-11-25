"""Usuarios del sistema — solicitantes (coordinador/jefe de área/colaborador),
OPIP, quien aprueba o rechaza el acceso, y guardias, que solo consultan las
solicitudes aprobadas vigentes."""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, DateTime, Enum, Boolean, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RolUsuario(str, PyEnum):
    SOLICITANTE = "solicitante"
    OPIP = "opip"
    GUARDIA = "guardia"


class Usuario(Base):
    __tablename__ = "usuarios_sistema"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # El username es el número de control de la persona.
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    nombre_completo: Mapped[str] = mapped_column(String(150), nullable=False)
    departamento: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    # Nulo hasta que la persona se autoregistra y elige su contraseña.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rol: Mapped[RolUsuario] = mapped_column(
        Enum(RolUsuario, name="rol_usuario"),
        nullable=False,
        index=True,
    )
    # True solo cuando ya completó el autoregistro (o fue creada directo, como OPIP).
    registrado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # True mientras siga usando la contraseña inicial: solo puede cambiarla.
    debe_cambiar_password: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false"), nullable=False
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )