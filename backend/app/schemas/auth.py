"""Schemas para login, autoregistro, recuperación de contraseña y tokens JWT."""
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.usuario import RolUsuario


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: RolUsuario
    nombre_completo: str
    departamento: str | None = None
    email: str | None = None
    debe_cambiar_password: bool = False


class PerfilOut(BaseModel):
    """Datos de la cuenta que el frontend refresca al abrir la app."""
    username: str
    rol: RolUsuario
    nombre_completo: str
    departamento: str | None
    email: str | None
    debe_cambiar_password: bool

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    """Payload interno decodificado del JWT."""
    username: str | None = None
    rol: RolUsuario | None = None


class RegistroRequest(BaseModel):
    """Autoregistro: la persona ya debe existir en el padrón por su número de
    control, y aquí elige su correo y contraseña por primera vez."""
    numero_control: str = Field(min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class CambiarPasswordRequest(BaseModel):
    password_actual: str = Field(min_length=1, max_length=100)
    nueva_password: str = Field(min_length=6, max_length=100)
    # Obligatorio solo si la cuenta todavía no tiene correo.
    email: EmailStr | None = None


class MiCorreoRequest(BaseModel):
    email: EmailStr = Field(max_length=150)
    # Obligatoria para reemplazar un correo ya registrado.
    password_actual: str | None = Field(default=None, max_length=100)


class OlvidePasswordRequest(BaseModel):
    numero_control: str = Field(min_length=1, max_length=50)
    email: EmailStr


class RestablecerPasswordRequest(BaseModel):
    numero_control: str = Field(min_length=1, max_length=50)
    email: EmailStr
    codigo: str = Field(min_length=4, max_length=10)
    nueva_password: str = Field(min_length=6, max_length=100)


class MensajeOut(BaseModel):
    mensaje: str