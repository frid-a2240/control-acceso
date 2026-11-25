"""Utilidades de seguridad: hashing bcrypt y firma/verificación de JWT."""
from datetime import datetime, timedelta, timezone

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings


# passlib con bcrypt — usamos rounds por defecto (12), suficiente para uso interno
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- Passwords ----------

# Contraseña con la que se da de alta el padrón; obliga a cambiarla al entrar.
PASSWORD_INICIAL = "123456"

# Se compara contra este hash cuando el usuario no existe, para que la
# respuesta tarde lo mismo y no revele qué números de control son válidos.
HASH_SENUELO = pwd_context.hash("senuelo")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------- JWT ----------

def create_access_token(subject: str, rol: str) -> str:
    """Genera un JWT con expiración configurada en .env."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": subject,
        "rol": rol,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Devuelve el payload si el token es válido; None si expiró o es inválido."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None