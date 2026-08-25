"""Dependencias de autenticación y control de acceso por rol."""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.database import get_db
from app.models.usuario import Usuario, RolUsuario


# tokenUrl relativo al ROOT_PATH — funciona igual en local y en IIS
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.ROOT_PATH}/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida el JWT y devuelve el usuario correspondiente."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exc

    username: str | None = payload.get("sub")
    if not username:
        raise credentials_exc

    user = db.query(Usuario).filter(Usuario.username == username).first()
    if not user or not user.activo:
        raise credentials_exc

    return user


def require_guardia(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.GUARDIA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo guardias pueden acceder a este recurso",
        )
    return user


def require_encargado(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.ENCARGADO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el encargado puede acceder a este recurso",
        )
    return user