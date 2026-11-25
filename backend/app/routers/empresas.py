"""Empresas — solo consulta de OPIP; se registran solas con cada solicitud."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import require_opip
from app.database import get_db
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.empresa import EmpresaOut


router = APIRouter(prefix="/api/empresas", tags=["empresas"])


@router.get("", response_model=list[EmpresaOut])
def listar_empresas(
    q: str | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_opip),
):
    query = db.query(Empresa)
    if q:
        query = query.filter(Empresa.nombre.ilike(f"%{q}%"))
    return query.order_by(Empresa.nombre).all()
