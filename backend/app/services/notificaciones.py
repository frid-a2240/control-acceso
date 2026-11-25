"""Avisos del flujo de una visita: en vivo (WebSocket) y por correo.

  1. Solicitud nueva   → OPIP
  2. Aprobada          → solicitante y guardias
  3. Rechazada         → solicitante

Se ejecutan en segundo plano: un fallo de correo se registra en consola y
nunca afecta la solicitud ni los demás avisos.
"""
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import SessionLocal
from app.models.usuario import RolUsuario, Usuario
from app.models.visita import EstadoVisita, Visita
from app.services.email_service import enviar_aviso
from app.services.pdf_generator import generar_pdf_visita
from app.services.vigencia import ventana_actual
from app.services.websocket_manager import manager


def _usuarios_activos(db: Session, rol: RolUsuario) -> list[Usuario]:
    return db.query(Usuario).filter(Usuario.rol == rol, Usuario.activo.is_(True)).all()


def _correos(usuarios: list[Usuario]) -> list[str]:
    """Correos registrados, sin repetir."""
    return list({u.email.lower(): u.email for u in usuarios if u.email}.values())


def _datos(visita: Visita) -> list[tuple[str, str]]:
    plazo = f"{visita.fecha_inicio:%d/%m/%Y}"
    if visita.fecha_fin != visita.fecha_inicio:
        plazo += f" al {visita.fecha_fin:%d/%m/%Y}"
    return [
        ("Folio", visita.folio),
        ("Empresa", visita.empresa_solicitante),
        ("Visitantes", ", ".join(p.nombre for p in visita.personas)),
        ("Persona a visitar", visita.persona_a_visitar),
        ("Área", visita.area_a_visitar),
        ("Fecha", plazo),
        ("Horario", visita.horario),
    ]


def _plazo(visita: Visita) -> str:
    """Desde y hasta cuándo permite el acceso una visita ya aprobada."""
    desde, hasta = visita.vigente_desde, visita.vigente_hasta
    if visita.fecha_inicio != visita.fecha_fin:
        return f"{visita.horario} cada día, hasta el {hasta:%d/%m/%Y}"
    return f"{desde:%d/%m/%Y %H:%M} a {hasta:%d/%m/%Y %H:%M}"


async def _correo(destinatarios: list[str], **aviso) -> None:
    if not destinatarios:
        return
    try:
        await enviar_aviso(destinatarios=destinatarios, **aviso)
    except Exception as exc:
        print(f"[CORREO] Falló el aviso \"{aviso.get('asunto')}\": {exc}")


async def avisar_solicitud_nueva(visita_id: int) -> None:
    """OPIP recibe la solicitud al instante y por correo con el formato en PDF."""
    db = SessionLocal()
    try:
        visita = db.query(Visita).filter(Visita.id == visita_id).first()
        if not visita:
            return
        opips = _usuarios_activos(db, RolUsuario.OPIP)

        for u in opips:
            await manager.notify_usuario(u.id, {
                "type": "visita_nueva",
                "visita_id": visita.id,
                "folio": visita.folio,
                "empresa": visita.empresa_solicitante,
                "solicitante": visita.solicitante.nombre_completo,
            })

        pdf = None
        try:
            pdf = generar_pdf_visita(visita)
        except Exception as exc:
            print(f"[PDF] Falló el formato de {visita.folio}: {exc}")

        solicitante = visita.solicitante
        quien = solicitante.nombre_completo
        if solicitante.departamento:
            quien += f" ({solicitante.departamento})"
        await _correo(
            _correos(opips) or [settings.OPIP_EMAIL],
            asunto=f"Nueva solicitud {visita.folio}",
            titulo="Nueva solicitud de acceso",
            intro="Se recibió una solicitud de acceso temporal que requiere tu aprobación.",
            datos=[*_datos(visita), ("Solicitó", quien)],
            boton="Revisar solicitud",
            ruta=f"/opip/visita/{visita.id}",
            adjunto=pdf,
        )
    finally:
        db.close()


async def avisar_resolucion(visita_id: int) -> None:
    """Solicitante y, si se aprobó, guardias: en vivo primero y luego por correo."""
    db = SessionLocal()
    try:
        visita = db.query(Visita).filter(Visita.id == visita_id).first()
        if not visita or visita.estado == EstadoVisita.PENDIENTE:
            return
        aprobada = visita.estado == EstadoVisita.APROBADA
        guardias = _usuarios_activos(db, RolUsuario.GUARDIA) if aprobada else []

        await manager.notify_usuario(visita.solicitante_id, {
            "type": "visita_resuelta",
            "visita_id": visita.id,
            "folio": visita.folio,
            "estado": visita.estado.value,
            "comentario": visita.comentario_resolucion,
            "fecha_resolucion": visita.fecha_resolucion.isoformat(),
        })
        for u in guardias:
            await manager.notify_usuario(u.id, {
                "type": "visita_aprobada",
                "visita_id": visita.id,
                "folio": visita.folio,
                "empresa": visita.empresa_solicitante,
                "hoy": ventana_actual(visita, datetime.now()) is not None,
            })

        datos = _datos(visita)
        if aprobada:
            datos.append(("Acceso permitido", _plazo(visita)))
        if visita.comentario_resolucion:
            datos.append(("Comentario de OPIP", visita.comentario_resolucion))
        resultado = "aprobada" if aprobada else "rechazada"
        await _correo(
            _correos([visita.solicitante]),
            asunto=f"Solicitud {visita.folio} {resultado}",
            titulo=f"Tu solicitud fue {resultado}",
            intro=(
                "OPIP autorizó el acceso que solicitaste."
                if aprobada else "OPIP no autorizó el acceso que solicitaste."
            ),
            datos=datos,
            boton="Ver solicitud",
            ruta=f"/solicitante/visita/{visita.id}",
        )
        await _correo(
            _correos(guardias),
            asunto=f"Acceso aprobado {visita.folio}",
            titulo="Nuevo acceso aprobado",
            intro=(
                "OPIP autorizó este acceso. Verifica que los datos coincidan cuando "
                "llegue el visitante; en el sistema aparece el día de la visita."
            ),
            datos=[*_datos(visita), ("Acceso permitido", _plazo(visita))],
            boton="Ver solicitudes aprobadas",
            ruta="/guardia",
        )
    finally:
        db.close()
