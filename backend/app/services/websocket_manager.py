"""Administrador de conexiones WebSocket para notificar a guardias.

Cada guardia se conecta a /ws/guardia/{usuario_id} y queda escuchando.
Cuando el encargado aprueba/rechaza una visita, notify_guardia() envía
el resultado al guardia que la creó, sin necesidad de refresh.
"""
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        # usuario_id -> lista de sockets (puede tener varias pestañas abiertas)
        self._connections: dict[int, list[WebSocket]] = {}

    async def connect(self, usuario_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(usuario_id, []).append(websocket)

    def disconnect(self, usuario_id: int, websocket: WebSocket) -> None:
        if usuario_id in self._connections:
            try:
                self._connections[usuario_id].remove(websocket)
            except ValueError:
                pass
            if not self._connections[usuario_id]:
                del self._connections[usuario_id]

    async def notify_guardia(self, usuario_id: int, payload: dict) -> None:
        """Envía un JSON al guardia. Si no está conectado, no pasa nada
        (verá la resolución la próxima vez que abra el listado)."""
        sockets = self._connections.get(usuario_id, [])
        muertos: list[WebSocket] = []
        for ws in sockets:
            try:
                await ws.send_json(payload)
            except Exception:
                muertos.append(ws)
        for ws in muertos:
            self.disconnect(usuario_id, ws)


# Singleton — se importa desde routers y desde el router de visitas
manager = ConnectionManager()