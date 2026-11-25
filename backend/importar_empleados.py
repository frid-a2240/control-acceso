"""Carga el padrón de empleados desde Excel como solicitantes.

Uso (desde backend/, con el venv activo):
    python importar_empleados.py                    # ../empleados_activos.xlsx
    python importar_empleados.py ruta/archivo.xlsx

Solo lee Clave (número de control), Nombre y Departamento. Se puede repetir:
  - empleado nuevo: se crea con la contraseña inicial (bcrypt) y debe cambiarla
    al entrar.
  - solicitante existente: se actualizan nombre y departamento; su contraseña
    no se toca.
  - OPIP o guardia: solo se actualiza el departamento.
Nadie se borra ni se desactiva: los que ya no vienen en el Excel se listan.
"""
import sys
from pathlib import Path

from openpyxl import load_workbook

from app.core.security import PASSWORD_INICIAL, hash_password
from app.database import SessionLocal
from app.models import Usuario
from app.models.usuario import RolUsuario


EXCEL_DEFAULT = Path(__file__).resolve().parent.parent / "empleados_activos.xlsx"
COLUMNAS = ("Clave", "Nombre", "Departamento")


def _texto(valor) -> str:
    return " ".join(str(valor if valor is not None else "").split())


def leer_excel(ruta: Path) -> list[tuple[str, str, str | None]]:
    """Devuelve (clave, nombre, departamento); aborta si hay datos inválidos."""
    hoja = load_workbook(ruta, data_only=True).active
    filas = hoja.iter_rows(values_only=True)
    encabezado = [_texto(c) for c in next(filas)]
    faltan = [c for c in COLUMNAS if c not in encabezado]
    if faltan:
        raise SystemExit(f"Al Excel le faltan columnas: {', '.join(faltan)}")
    i_clave, i_nombre, i_depto = (encabezado.index(c) for c in COLUMNAS)

    empleados, vistas = [], set()
    for n, fila in enumerate(filas, start=2):
        if not any(_texto(c) for c in fila):
            continue
        clave, nombre = _texto(fila[i_clave]), _texto(fila[i_nombre])
        if not clave.isdigit() or not nombre:
            raise SystemExit(f"Fila {n}: clave o nombre inválido. No se importó nada.")
        if clave in vistas:
            raise SystemExit(f"Fila {n}: clave {clave} duplicada. No se importó nada.")
        vistas.add(clave)
        empleados.append((clave, nombre, _texto(fila[i_depto]) or None))
    return empleados


def main() -> None:
    ruta = Path(sys.argv[1]) if len(sys.argv) > 1 else EXCEL_DEFAULT
    empleados = leer_excel(ruta)

    db = SessionLocal()
    try:
        existentes = {u.username: u for u in db.query(Usuario).all()}
        nuevos = actualizados = 0
        for clave, nombre, depto in empleados:
            u = existentes.get(clave)
            if u is None:
                db.add(Usuario(
                    username=clave,
                    nombre_completo=nombre,
                    departamento=depto,
                    password_hash=hash_password(PASSWORD_INICIAL),
                    rol=RolUsuario.SOLICITANTE,
                    registrado=True,
                    debe_cambiar_password=True,
                ))
                nuevos += 1
                continue
            u.departamento = depto
            if u.rol == RolUsuario.SOLICITANTE:
                u.nombre_completo = nombre
            else:
                print(f"- {clave} es {u.rol.value}: conserva rol, nombre y contraseña")
            actualizados += 1
        db.commit()

        claves = {e[0] for e in empleados}
        fuera = sorted(
            u.username for u in existentes.values()
            if u.rol == RolUsuario.SOLICITANTE and u.activo and u.username not in claves
        )
        print(f"OK: {len(empleados)} en Excel, {nuevos} nuevos, {actualizados} ya existían.")
        if fuera:
            print(f"Solicitantes activos que no vienen en el Excel: {', '.join(fuera)}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
