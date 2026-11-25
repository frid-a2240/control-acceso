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


def get_usuario_autenticado(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida el JWT y devuelve el usuario, aunque le falte completar su cuenta.

    Solo para contraseña, correo y /me; lo demás usa get_current_user."""
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


def get_current_user(user: Usuario = Depends(get_usuario_autenticado)) -> Usuario:
    """Usuario autenticado que ya cambió la contraseña inicial y registró su correo."""
    if user.debe_cambiar_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes cambiar tu contraseña inicial antes de continuar",
        )
    if not user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Debes registrar tu correo antes de continuar",
        )
    return user


def require_solicitante(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.SOLICITANTE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo coordinadores, jefes de área o colaboradores pueden acceder a este recurso",
        )
    return user


def require_captura(user: Usuario = Depends(get_current_user)) -> Usuario:
    """Solicitante u OPIP. El guardia solo consulta solicitudes aprobadas."""
    if user.rol not in (RolUsuario.SOLICITANTE, RolUsuario.OPIP):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu usuario solo puede consultar las solicitudes aprobadas",
        )
    return user


def require_guardia_u_opip(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol not in (RolUsuario.GUARDIA, RolUsuario.OPIP):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo guardias y OPIP pueden acceder a este recurso",
        )
    return user


def require_opip(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.rol != RolUsuario.OPIP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo OPIP puede acceder a este recurso",
        )
    return user