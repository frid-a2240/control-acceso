"""CRUD ligero de empresas — para autocompletar en el formato."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_encargado
from app.database import get_db
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.empresa import EmpresaCreate, EmpresaOut


router = APIRouter(prefix="/api/empresas", tags=["empresas"])


@router.get("", response_model=list[EmpresaOut])
def listar_empresas(
    q: str | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    query = db.query(Empresa)
    if q:
        query = query.filter(Empresa.nombre.ilike(f"%{q}%"))
    return query.order_by(Empresa.nombre).limit(50).all()


@router.post("", response_model=EmpresaOut, status_code=status.HTTP_201_CREATED)
def crear_empresa(
    data: EmpresaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    existing = db.query(Empresa).filter(Empresa.nombre.ilike(data.nombre)).first()
    if existing:
        return existing
    e = Empresa(nombre=data.nombre.strip())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.delete("/{empresa_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_encargado),
):
    """Borra una empresa (uso temporal mientras el sistema está en pruebas).

    Si tiene personas registradas a su nombre se rechaza con 409.
    """
    e = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    try:
        db.delete(e)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                f"No se puede borrar {e.nombre}: tiene personas registradas a su "
                "nombre. Borra o reasigna primero esas personas."
            ),
        )