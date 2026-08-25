"""Usuarios del sistema — guardias y encargados de control de acceso."""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, DateTime, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RolUsuario(str, PyEnum):
    GUARDIA = "guardia"
    ENCARGADO = "encargado"


class Usuario(Base):
    __tablename__ = "usuarios_sistema"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    nombre_completo: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(
        Enum(RolUsuario, name="rol_usuario"),
        nullable=False,
        index=True,
    )
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )