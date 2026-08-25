"""Punto de entrada de la aplicación Control de Acceso ISP."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import auth, empresas, personas, vehiculos, visitas, ws


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    root_path=settings.ROOT_PATH,
)

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Rutas ----------
app.include_router(auth.router)
app.include_router(empresas.router)
app.include_router(personas.router)
app.include_router(vehiculos.router)
app.include_router(visitas.router)
app.include_router(ws.router)


# ---------- Archivos estáticos (fotos y PDFs generados) ----------
STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage"
STORAGE_DIR.mkdir(exist_ok=True)
(STORAGE_DIR / "fotos").mkdir(exist_ok=True)
(STORAGE_DIR / "pdfs").mkdir(exist_ok=True)

app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")


# ---------- Healthcheck ----------
@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "app": settings.APP_NAME}