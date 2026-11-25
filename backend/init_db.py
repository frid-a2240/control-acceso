"""Crea todas las tablas en PostgreSQL.

Se puede repetir: crea lo que falte y no borra datos.
Para cambios de esquema futuros usaremos Alembic (lo agregamos después).
"""
from sqlalchemy import text

from app.database import Base, engine
from app.models import *  # noqa: F401,F403  — necesario para registrar todos los modelos


# Columnas agregadas después de la primera versión de la tabla
COLUMNAS_NUEVAS = [
    "ALTER TABLE usuarios_sistema ADD COLUMN IF NOT EXISTS departamento VARCHAR(150)",
    "ALTER TABLE usuarios_sistema ADD COLUMN IF NOT EXISTS "
    "debe_cambiar_password BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE visitas ADD COLUMN IF NOT EXISTS hora_inicio TIME",
    "ALTER TABLE visitas ADD COLUMN IF NOT EXISTS vigente_hasta TIMESTAMP",
    "ALTER TABLE visitas ADD COLUMN IF NOT EXISTS vigente_desde TIMESTAMP",
    # Solicitudes capturadas antes de existir el plazo: valen hasta su fecha fin
    "UPDATE visitas SET hora_inicio = COALESCE(hora_inicio, '00:00'), "
    "vigente_hasta = COALESCE(vigente_hasta, fecha_fin + INTERVAL '1 day') "
    "WHERE hora_inicio IS NULL OR vigente_hasta IS NULL",
    "UPDATE visitas SET vigente_desde = fecha_inicio + hora_inicio "
    "WHERE estado = 'APROBADA' AND vigente_desde IS NULL",
    "ALTER TABLE visitas ALTER COLUMN hora_inicio SET NOT NULL",
    "ALTER TABLE visitas ALTER COLUMN vigente_hasta SET NOT NULL",
    "CREATE INDEX IF NOT EXISTS ix_visitas_vigente_hasta ON visitas (vigente_hasta)",
    # Cada solicitante ve solo sus visitantes: el dueño de lo ya registrado es
    # quien lo usó en su primera solicitud
    "ALTER TABLE personas ADD COLUMN IF NOT EXISTS registrado_por_id INTEGER "
    "REFERENCES usuarios_sistema(id)",
    "ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS registrado_por_id INTEGER "
    "REFERENCES usuarios_sistema(id)",
    "UPDATE personas p SET registrado_por_id = (SELECT v.solicitante_id "
    "FROM visitas v JOIN visita_personas vp ON vp.visita_id = v.id "
    "WHERE vp.persona_id = p.id ORDER BY v.id LIMIT 1) WHERE registrado_por_id IS NULL",
    "UPDATE vehiculos x SET registrado_por_id = (SELECT p.registrado_por_id "
    "FROM personas p JOIN persona_vehiculos pv ON pv.persona_id = p.id "
    "WHERE pv.vehiculo_id = x.id AND p.registrado_por_id IS NOT NULL "
    "ORDER BY p.id LIMIT 1) WHERE registrado_por_id IS NULL",
    "ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS anio INTEGER",
    # Empresas de las solicitudes que ya se habían capturado
    "INSERT INTO empresas (nombre, fecha_creacion) "
    "SELECT DISTINCT ON (lower(n)) n, f FROM (SELECT "
    "regexp_replace(trim(empresa_solicitante), '\\s+', ' ', 'g') AS n, "
    "fecha_creacion AS f FROM visitas) s "
    "WHERE NOT EXISTS (SELECT 1 FROM empresas e WHERE lower(e.nombre) = lower(s.n)) "
    "ORDER BY lower(n), f",
    # La unicidad pasa de global a por solicitante
    *(
        sql
        for tabla, columna, unica in (
            ("personas", "numero_identificacion", "uq_personas_dueno_identificacion"),
            ("vehiculos", "placas", "uq_vehiculos_dueno_placas"),
        )
        for sql in (
            f"DROP INDEX IF EXISTS ix_{tabla}_{columna}",
            f"CREATE INDEX ix_{tabla}_{columna} ON {tabla} ({columna})",
            f"CREATE INDEX IF NOT EXISTS ix_{tabla}_registrado_por_id ON {tabla} (registrado_por_id)",
            f"ALTER TABLE {tabla} DROP CONSTRAINT IF EXISTS {unica}",
            f"ALTER TABLE {tabla} ADD CONSTRAINT {unica} UNIQUE (registrado_por_id, {columna})",
        )
    ),
]


def main() -> None:
    print("Creando tablas...")
    Base.metadata.create_all(bind=engine)
    # Un valor nuevo de enum debe confirmarse antes de poder usarse
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'GUARDIA'"))
    with engine.begin() as conn:
        for sql in COLUMNAS_NUEVAS:
            conn.execute(text(sql))
    print("OK — tablas creadas:")
    for table_name in Base.metadata.tables.keys():
        print(f"  · {table_name}")


if __name__ == "__main__":
    main()