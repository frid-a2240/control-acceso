"""Login — devuelve JWT con rol embebido."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import Token


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login con username + password. Devuelve JWT y datos del usuario."""
    user = db.query(Usuario).filter(Usuario.username == form.username).first()

    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario deshabilitado",
        )

    token = create_access_token(subject=user.username, rol=user.rol.value)
    return Token(
        access_token=token,
        rol=user.rol,
        nombre_completo=user.nombre_completo,
    )