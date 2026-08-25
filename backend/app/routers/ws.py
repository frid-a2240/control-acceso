"""Endpoint WebSocket — el guardia se suscribe y recibe la resolución al instante."""
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.security import decode_access_token
from app.database import SessionLocal
from app.models.usuario import Usuario, RolUsuario
from app.services.websocket_manager import manager


router = APIRouter(tags=["ws"])


@router.websocket("/ws/guardia")
async def ws_guardia(
    websocket: WebSocket,
    token: str = Query(..., description="JWT del guardia"),
):
    """El guardia se conecta con el token en query string:
        ws://.../ws/guardia?token=<JWT>
    """
    payload = decode_access_token(token)
    if not payload or payload.get("rol") != RolUsuario.GUARDIA.value:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    username = payload.get("sub")

    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.username == username).first()
        if not user or not user.activo:
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
        