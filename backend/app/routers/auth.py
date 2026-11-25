"""Login, autoregistro y recuperación de contraseña."""
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.auth import get_usuario_autenticado
from app.core.limitador import limite_folio, limite_login
from app.core.security import (
    HASH_SENUELO, PASSWORD_INICIAL, create_access_token, hash_password, verify_password,
)
from app.database import get_db
from app.models.usuario import Usuario, RolUsuario
from app.models.password_reset import PasswordResetCode
from app.schemas.auth import (
    Token, RegistroRequest, CambiarPasswordRequest, MiCorreoRequest,
    OlvidePasswordRequest, RestablecerPasswordRequest, MensajeOut, PerfilOut,
)
from app.services.email_service import enviar_codigo_recuperacion


router = APIRouter(prefix="/api/auth", tags=["auth"])

CODIGO_VALIDEZ_MINUTOS = 30


def _validar_nueva_password(nueva: str) -> None:
    if nueva == PASSWORD_INICIAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Elige una contraseña distinta a la inicial",
        )
    if len(nueva.encode("utf-8")) > 72:  # bcrypt ignora lo que pase de 72 bytes
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña es demasiado larga",
        )


def _cuenta_por_control_y_correo(
    db: Session, numero_control: str, email: str
) -> Usuario | None:
    """Varias cuentas pueden compartir correo: el número de control decide cuál."""
    return (
        db.query(Usuario)
        .filter(
            Usuario.username == numero_control.strip(),
            func.lower(Usuario.email) == email.lower(),
            Usuario.registrado.is_(True),
        )
        .first()
    )


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login con username (número de control) + password. Devuelve JWT y datos del usuario."""
    username = form.username.strip()
    limite_login.registrar_intento(username)
    user = db.query(Usuario).filter(Usuario.username == username).first()

    puede_entrar = bool(user and user.registrado and user.password_hash)
    password_ok = verify_password(
        form.password, user.password_hash if puede_entrar else HASH_SENUELO
    )
    if not puede_entrar or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Número de control o contraseña incorrectos",
        )
    limite_login.limpiar(username)
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
        departamento=user.departamento,
        email=user.email,
        debe_cambiar_password=user.debe_cambiar_password,
    )


@router.get("/me", response_model=PerfilOut)
def mi_perfil(user: Usuario = Depends(get_usuario_autenticado)):
    return user


@router.post("/mi-correo", response_model=MensajeOut)
def mi_correo(
    data: MiCorreoRequest,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_usuario_autenticado),
):
    """Registra el correo de notificaciones. Para reemplazar uno existente pide
    la contraseña, porque ese correo también sirve para recuperar la cuenta."""
    if user.email:
        clave = f"cambio:{user.id}"
        limite_login.registrar_intento(clave)
        if not verify_password(data.password_actual or "", user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La contraseña actual no es correcta",
            )
        limite_login.limpiar(clave)
    user.email = data.email
    db.commit()
    return MensajeOut(mensaje="Correo registrado.")


@router.post("/cambiar-password", response_model=MensajeOut)
def cambiar_password(
    data: CambiarPasswordRequest,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_usuario_autenticado),
):
    """Cambia la contraseña propia (obligatorio si aún usa la inicial)."""
    clave = f"cambio:{user.id}"
    limite_login.registrar_intento(clave)
    if not verify_password(data.password_actual, user.password_hash):
        # 400 y no 401: el frontend cierra la sesión ante un 401
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual no es correcta",
        )
    limite_login.limpiar(clave)

    _validar_nueva_password(data.nueva_password)
    if data.nueva_password == data.password_actual:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser distinta a la actual",
        )
    # Aquí solo se registra por primera vez; reemplazarlo va por /mi-correo
    if not user.email:
        if not data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo es obligatorio para recibir notificaciones",
            )
        user.email = data.email

    user.password_hash = hash_password(data.nueva_password)
    user.debe_cambiar_password = False
    db.commit()
    return MensajeOut(mensaje="Contraseña actualizada.")


@router.post("/registro", response_model=MensajeOut)
def registro(
    data: RegistroRequest,
    db: Session = Depends(get_db),
):
    """Autoregistro: la persona ya existe en el padrón (dada de alta por
    número de control), y aquí completa su cuenta eligiendo correo y
    contraseña por primera vez."""
    user = db.query(Usuario).filter(Usuario.username == data.numero_control).first()

    # Solo solicitantes: una cuenta OPIP nunca se puede reclamar por aquí
    if not user or user.rol != RolUsuario.SOLICITANTE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ese número de control no está autorizado. Verifica que sea correcto.",
        )
    if user.registrado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está registrada. Inicia sesión o usa \"Olvidé mi contraseña\".",
        )

    _validar_nueva_password(data.password)
    user.email = data.email
    user.password_hash = hash_password(data.password)
    user.registrado = True
    db.commit()

    return MensajeOut(mensaje="Cuenta creada. Ya puedes iniciar sesión con tu número de control.")


@router.post("/olvide-password", response_model=MensajeOut)
async def olvide_password(
    data: OlvidePasswordRequest,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Genera un folio de recuperación y lo envía por correo, si el número de
    control y el correo corresponden a la misma cuenta. Responde igual en ambos
    casos para no revelar qué cuentas existen."""
    limite_folio.registrar_intento(f"envio:{data.numero_control.strip()}")
    user = _cuenta_por_control_y_correo(db, data.numero_control, data.email)

    if user:
        codigo = f"{secrets.randbelow(1_000_000):06d}"
        db.add(PasswordResetCode(
            usuario_id=user.id,
            codigo=codigo,
            expira=datetime.utcnow() + timedelta(minutes=CODIGO_VALIDEZ_MINUTOS),
        ))
        db.commit()
        background.add_task(
            enviar_codigo_recuperacion, user.email, user.nombre_completo, codigo
        )

    return MensajeOut(
        mensaje="Si los datos coinciden con una cuenta, te enviamos un folio para restablecer tu contraseña."
    )


@router.post("/restablecer-password", response_model=MensajeOut)
def restablecer_password(
    data: RestablecerPasswordRequest,
    db: Session = Depends(get_db),
):
    """Valida el folio recibido por correo y actualiza la contraseña."""
    clave = f"folio:{data.numero_control.strip()}"
    limite_folio.registrar_intento(clave)
    user = _cuenta_por_control_y_correo(db, data.numero_control, data.email)
    if not user:
        raise HTTPException(status_code=400, detail="Folio o correo inválidos")

    reset = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.usuario_id == user.id,
            PasswordResetCode.codigo == data.codigo,
            PasswordResetCode.usado.is_(False),
        )
        .order_by(PasswordResetCode.fecha_creacion.desc())
        .first()
    )
    if not reset or reset.expira < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Folio o correo inválidos")

    _validar_nueva_password(data.nueva_password)
    user.password_hash = hash_password(data.nueva_password)
    user.debe_cambiar_password = False
    # Invalida este folio y cualquier otro pendiente de la cuenta
    db.query(PasswordResetCode).filter(
        PasswordResetCode.usuario_id == user.id
    ).update({PasswordResetCode.usado: True})
    db.commit()
    limite_folio.limpiar(clave)

    return MensajeOut(mensaje="Contraseña actualizada. Ya puedes iniciar sesión.")