"""Registro central de modelos — importar aquí garantiza que SQLAlchemy los descubra todos."""
from app.models.usuario import Usuario, RolUsuario
from app.models.empresa import Empresa
from app.models.persona import Persona
from app.models.vehiculo import Vehiculo, persona_vehiculos
from app.models.visita import Visita, EstadoVisita, visita_personas, visita_vehiculos

__all__ = [
    "Usuario", "RolUsuario",
    "Empresa",
    "Persona",
    "Vehiculo", "persona_vehiculos",
    "Visita", "EstadoVisita",
    "visita_personas", "visita_vehiculos",
]