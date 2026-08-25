"""Envío de correos vía Gmail SMTP.

Usa fastapi-mail (async, con soporte de adjuntos).
"""
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


async def enviar_notificacion_encargado(
    folio: str,
    empresa: str,
    persona_a_visitar: str,
    area: str,
    pdf_path: Path | None = None,
) -> None:
    """Notifica al encargado que hay una nueva solicitud pendiente de aprobación."""

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6);
                    color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Nueva solicitud de acceso</h2>
            <p style="margin: 4px 0 0 0; opacity: .9;">Control de Acceso ISP</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: 0;
                    padding: 24px; border-radius: 0 0 8px 8px;">
            <p>Se recibió una nueva solicitud de acceso temporal
               que requiere su aprobación:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Folio:</td>
                    <td style="padding: 8px 0; font-family: monospace;
                               font-weight: bold;">{folio}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Empresa:</td>
                    <td style="padding: 8px 0;">{empresa}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Persona a visitar:</td>
                    <td style="padding: 8px 0;">{persona_a_visitar}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Área:</td>
                    <td style="padding: 8px 0;">{area}</td>
                </tr>
            </table>

            <p style="margin-top: 24px;">
                Ingrese a la aplicación para revisar el formato completo
                y aprobar o rechazar la solicitud.
            </p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
                Este es un mensaje automático. No responda a este correo.
            </p>
        </div>
    </div>
    """

    message = MessageSchema(
        subject=f"[Control de Acceso ISP] Nueva solicitud {folio}",
        recipients=[settings.ENCARGADO_EMAIL],
        body=html,
        subtype=MessageType.html,
        attachments=[str(pdf_path)] if pdf_path else [],
    )

    await _fm.send_message(message)