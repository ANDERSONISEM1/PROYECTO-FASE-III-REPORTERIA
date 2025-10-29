from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import engine, Base
# from app.routers import auth, users, games, teams, integration, admin  # Temporarily disabled
from app.controllers import partido_controller, inicio_controller
from app.config import settings

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Python API...")
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    print("🛑 Shutting down Python API...")

app = FastAPI(
    title="Marcador Basketball - Python API",
    description="API de Python para el sistema de marcador de basketball",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])  # Temporarily disabled
# app.include_router(users.router, prefix="/api/users", tags=["Users"])  # Temporarily disabled
# app.include_router(games.router, prefix="/api/games", tags=["Games"])  # Temporarily disabled
# app.include_router(teams.router, prefix="/api/teams", tags=["Teams"])  # Temporarily disabled
# app.include_router(integration.router, prefix="/api/integration", tags=["Integration"])  # Temporarily disabled
# app.include_router(admin.router, prefix="/api/admin", tags=["Administration"])  # Temporarily disabled
app.include_router(partido_controller.router, tags=["Partidos"])
app.include_router(inicio_controller.router, prefix="/api/admin/inicio", tags=["Inicio"])

@app.get("/")
async def root():
    return {
        "message": "Marcador Basketball - Python API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "python-api"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5082)),
        reload=True
    )
