"""Schemas para login y tokens JWT."""
from pydantic import BaseModel

from app.models.usuario import RolUsuario


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: RolUsuario
    nombre_completo: str


class TokenData(BaseModel):
    """Payload interno decodificado del JWT."""
    username: str | None = None
    rol: RolUsuario | None = None