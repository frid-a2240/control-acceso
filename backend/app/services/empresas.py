"""Catálogo de empresas — se llena solo con las solicitudes."""
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.empresa import Empresa


def registrar_empresa(db: Session, nombre: str) -> None:
    """Agrega la empresa si no existe, sin distinguir mayúsculas ni espacios
    de más. Queda dentro de la transacción de quien la llama."""
    nombre = " ".join(nombre.split())
    existe = db.query(Empresa.id).filter(func.lower(Empresa.nombre) == nombre.lower()).first()
    if existe:
        return
    try:
        with db.begin_nested():
            db.add(Empresa(nombre=nombre))
    except IntegrityError:
        pass  # otra solicitud la registró al mismo tiempo
