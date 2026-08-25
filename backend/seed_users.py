"""Crea usuarios iniciales del sistema.

Ejecutar una sola vez después de init_db.py. Idempotente: si el usuario
ya existe, lo omite.
"""
from app.database import SessionLocal
from app.models.usuario import Usuario, RolUsuario
from app.core.security import hash_password


USUARIOS_INICIALES = [
    {
        "username": "guardia1",
        "nombre_completo": "Guardia 1",
        "email": None,
        "password": "guardia123",
        "rol": RolUsuario.GUARDIA,
    },
    {
        "username": "encargado",
        "nombre_completo": "Encargado de Control de Acceso",
        "email": "isp.amayacuriel@gmail.com",  # ajusta al correo real
        "password": "encargado123",
        "rol": RolUsuario.ENCARGADO,
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        for data in USUARIOS_INICIALES:
            existing = db.query(Usuario).filter(Usuario.username == data["username"]).first()
            if existing:
                print(f"· {data['username']} ya existe — omitido")
                continue

            u = Usuario(
                username=data["username"],
                nombre_completo=data["nombre_completo"],
                email=data["email"],
                password_hash=hash_password(data["password"]),
                rol=data["rol"],
            )
            db.add(u)
            print(f"+ {data['username']} ({data['rol'].value}) — password: {data['password']}")

        db.commit()
        print("\nOK — usuarios iniciales listos.")
        print("⚠️  Cambia estos passwords desde la app en cuanto tengamos el módulo de usuarios.")
    finally:
        db.close()

if __name__ == "__main__":
    main()