"""Endpoint WebSocket — cada usuario recibe sus avisos al instante."""
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.security import decode_access_token
from app.database import SessionLocal
from app.models.usuario import Usuario
from app.services.websocket_manager import manager


router = APIRouter(tags=["ws"])


@router.websocket("/ws/notificaciones")
async def ws_notificaciones(
    websocket: WebSocket,
    token: str = Query(..., description="JWT del usuario"),
):
    """Se conecta con el token en query string:
        ws://.../ws/notificaciones?token=<JWT>
    """
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    username = payload.get("sub")

    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.username == username).first()
        if (
            not user or not user.activo or user.debe_cambiar_password
            or not user.email
        ):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        usuario_id = user.id
    finally:
        db.close()

    await manager.connect(usuario_id, websocket)
    try:
        while True:
            # Keepalive: cualquier mensaje del cliente lo ignoramos, solo escuchamos
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(usuario_id, websocket)
        