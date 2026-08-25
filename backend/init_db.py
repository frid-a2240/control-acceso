"""Crea todas las tablas en PostgreSQL.

Ejecutar solo la primera vez o después de un DROP completo.
Para cambios de esquema futuros usaremos Alembic (lo agregamos después).
"""
from app.database import Base, engine
from app.models import *  # noqa: F401,F403  — necesario para registrar todos los modelos


def main() -> None:
    print("Creando tablas...")
    Base.metadata.create_all(bind=engine)
    print("OK — tablas creadas:")
    for table_name in Base.metadata.tables.keys():
        print(f"  · {table_name}")


if __name__ == "__main__":
    main()