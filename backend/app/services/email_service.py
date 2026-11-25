"""Envío de correos vía Gmail SMTP.

Usa fastapi-mail (async, con soporte de adjuntos).
"""
from html import escape
from pathlib import Path

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.core.config import settings


_conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

_fm = FastMail(_conf)


async def enviar_aviso(
    destinatarios: list[str],
    asunto: str,
    titulo: str,
    intro: str,
    datos: list[tuple[str, str]],
    boton: str,
    ruta: str,
    adjunto: Path | None = None,
) -> None:
    """Aviso del flujo de una visita, con enlace directo al sistema.

    Lo que captura el usuario se escapa para que no pueda inyectar HTML.
    """
    filas = "".join(
        f"""
                <tr>
                    <td style="padding: 8px 12px 8px 0; color: #6b7280;
                               vertical-align: top;">{escape(etiqueta)}:</td>
                    <td style="padding: 8px 0; font-weight: bold;">{escape(valor)}</td>
                </tr>"""
        for etiqueta, valor in datos
    )
    url = escape(settings.APP_URL.rstrip("/") + ruta, quote=True)

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="background: #1e40af; background: linear-gradient(135deg, #1e40af, #3b82f6);
                    color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">{escape(titulo)}</h2>
            <p style="margin: 4px 0 0 0; opacity: .9;">SICAPI · Control de Acceso ISP</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: 0;
                    padding: 24px; border-radius: 0 0 8px 8px;">
            <p>{escape(intro)}</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">{filas}
            </table>
            <p style="text-align: center; margin: 28px 0;">
                <a href="{url}" style="background: #1e293b; color: white; padding: 12px 24px;
                          border-radius: 8px; text-decoration: none;
                          font-weight: bold;">{escape(boton)}</a>
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
                Este es un mensaje automático. No responda a este correo.
            </p>
        </div>
    </div>
    """

    await _fm.send_message(MessageSchema(
        subject=f"[SICAPI] {asunto}",
        recipients=destinatarios,
        body=html,
        subtype=MessageType.html,
        attachments=[str(adjunto)] if adjunto else [],
    ))


async def enviar_codigo_recuperacion(
    email: str,
    nombre_completo: str,
    codigo: str,
) -> None:
    """Envía el folio para restablecer contraseña (autoregistro / login)."""

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6);
                    color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Recuperación de contraseña</h2>
            <p style="margin: 4px 0 0 0; opacity: .9;">Control de Acceso ISP</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: 0;
                    padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Hola {escape(nombre_completo)}, recibimos una solicitud para restablecer
               tu contraseña. Usa el siguiente folio para completar el proceso
               en la aplicación:</p>

            <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; font-family: monospace;
                             font-size: 28px; font-weight: bold; letter-spacing: 4px;
                             background: #f3f4f6; padding: 12px 24px; border-radius: 8px;
                             color: #0f172a;">{codigo}</span>
            </div>

            <p style="color: #6b7280; font-size: 12px;">
                Este folio es válido por 30 minutos. Si tú no solicitaste este
                cambio, ignora este correo — tu contraseña actual sigue siendo válida.
            </p>
        </div>
    </div>
    """

    message = MessageSchema(
        subject="[Control de Acceso ISP] Folio para restablecer tu contraseña",
        recipients=[email],
        body=html,
        subtype=MessageType.html,
    )

    await _fm.send_message(message)