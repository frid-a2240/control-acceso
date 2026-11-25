"""Límite de intentos fallidos (login, cambio de contraseña y folio).

Vive en memoria: se reinicia con el servidor y supone un solo proceso de
uvicorn, que es como corre hoy el sistema.
"""
import threading
import time

from fastapi import HTTPException, status


class LimitadorIntentos:
    def __init__(self, maximo: int, ventana_segundos: int) -> None:
        self.maximo = maximo
        self.ventana = ventana_segundos
        self._intentos: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def registrar_intento(self, clave: str) -> None:
        """Cuenta el intento antes de validar; lanza 429 si ya se agotaron.

        Contar antes evita que peticiones simultáneas se salten el límite.
        """
        ahora = time.monotonic()
        with self._lock:
            # Descarta lo vencido para que el diccionario no crezca sin fin
            self._intentos = {
                k: vigentes
                for k, v in self._intentos.items()
                if (vigentes := [t for t in v if ahora - t < self.ventana])
            }
            intentos = self._intentos.setdefault(clave, [])
            if len(intentos) >= self.maximo:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Demasiados intentos. Espera {self.ventana // 60} minutos e inténtalo de nuevo.",
                )
            intentos.append(ahora)

    def limpiar(self, clave: str) -> None:
        """Se llama cuando el intento fue correcto."""
        with self._lock:
            self._intentos.pop(clave, None)


limite_login = LimitadorIntentos(maximo=5, ventana_segundos=15 * 60)
limite_folio = LimitadorIntentos(maximo=5, ventana_segundos=30 * 60)
