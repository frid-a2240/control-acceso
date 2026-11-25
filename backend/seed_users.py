"""Crea usuarios iniciales del sistema.

Ejecutar una sola vez después de init_db.py. Idempotente: si el usuario
ya existe, lo omite.
"""
from app.database import SessionLocal
from app.models.usuario import Usuario, RolUsuario
from app.core.security import hash_password


USUARIOS_INICIALES = [
    {
        "username": "solicitante_demo",
        "nombre_completo": "Solicitante Demo",
        "email": None,
        "password": "solicitante123",
        "rol": RolUsuario.GUARDIA,  # usuario de prueba de los guardias
    },
    {
        "username": "opip",
        "nombre_completo": "OPIP - Control de Acceso",
        "email": "isp.amayacuriel@gmail.com",  # ajusta al correo real
        "password": "opip123",
        "rol": RolUsuario.OPIP,
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
                registrado=True,
                debe_cambiar_password=True,
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