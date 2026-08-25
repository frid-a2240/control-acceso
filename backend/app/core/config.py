"""Configuración central de la aplicación.

Lee variables de entorno desde .env y las expone como settings tipados.
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Correo (Gmail SMTP)
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_FROM_NAME: str = "Control de Acceso ISP"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False

    # Destinatario notificaciones de aprobación
    ENCARGADO_EMAIL: str

    # Aplicación
    APP_NAME: str = "Control de Acceso ISP"
    ROOT_PATH: str = ""
    CORS_ORIGINS: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Convierte la cadena separada por comas en lista para CORSMiddleware."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Singleton cacheado — evita releer .env en cada request."""
    return Settings()


settings = get_settings()