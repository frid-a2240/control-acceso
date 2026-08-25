"""Conexión a PostgreSQL y sesión de SQLAlchemy."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.core.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # detecta conexiones muertas antes de usarlas
    echo=False,          # cámbialo a True si quieres ver el SQL crudo en consola
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Clase base para todos los modelos ORM."""
    pass


def get_db():
    """Dependencia FastAPI: abre una sesión, la cede al endpoint, la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()