from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Game, Team, GameEvent
from ..schemas import Game as GameSchema, GameEvent as GameEventSchema
from ..auth import get_current_active_user

router = APIRouter()

@router.get("/partidos-finalizados", response_model=List[GameSchema])
async def get_partidos_finalizados(
    equipo_id: Optional[int] = Query(None, alias="equipoId"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Endpoint compatible con .NET para obtener partidos finalizados
    """
    query = db.query(Game).filter(Game.game_status == "finished")
    
    if equipo_id:
        query = query.filter(
            (Game.home_team_id == equipo_id) | (Game.away_team_id == equipo_id)
        )
    
    games = query.order_by(Game.game_date.desc()).offset(skip).limit(limit).all()
    return games

@router.get("/partidos/{partido_id}/eventos", response_model=List[GameEventSchema])
async def get_eventos_partido(
    partido_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene todos los eventos de un partido específico
    """
    # Verificar que el partido existe
    game = db.query(Game).filter(Game.id == partido_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    events = db.query(GameEvent).filter(
        GameEvent.game_id == partido_id
    ).order_by(GameEvent.created_at.desc()).all()
    
    return events

@router.get("/estadisticas/resumen")
async def get_estadisticas_resumen(
    db: Session = Depends(get_db)
):
    """
    Resumen de estadísticas para integración con .NET
    """
    total_games = db.query(Game).count()
    finished_games = db.query(Game).filter(Game.game_status == "finished").count()
    live_games = db.query(Game).filter(Game.game_status == "live").count()
    scheduled_games = db.query(Game).filter(Game.game_status == "scheduled").count()
    total_teams = db.query(Team).filter(Team.is_active == True).count()
    total_events = db.query(GameEvent).count()
    
    return {
        "total_partidos": total_games,
        "partidos_finalizados": finished_games,
        "partidos_en_vivo": live_games,
        "partidos_programados": scheduled_games,
        "total_equipos": total_teams,
        "total_eventos": total_events,
        "timestamp": datetime.utcnow()
    }

@router.post("/sync/partido-desde-dotnet")
async def sync_partido_desde_dotnet(
    partido_data: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Sincroniza un partido desde .NET API
    """
    try:
        # Verificar si ya existe
        existing_game = db.query(Game).filter(Game.id == partido_data.get("id")).first()
        
        if existing_game:
            # Actualizar partido existente
            for key, value in partido_data.items():
                if hasattr(existing_game, key):
                    setattr(existing_game, key, value)
        else:
            # Crear nuevo partido
            new_game = Game(
                id=partido_data.get("id"),
                home_team_id=partido_data.get("equipo_local_id"),
                away_team_id=partido_data.get("equipo_visitante_id"),
                home_score=partido_data.get("puntos_local", 0),
                away_score=partido_data.get("puntos_visitante", 0),
                game_status="finished" if partido_data.get("estado") == "finalizado" else "scheduled",
                game_date=datetime.fromisoformat(partido_data.get("fecha_hora_inicio")) if partido_data.get("fecha_hora_inicio") else datetime.utcnow(),
                venue=partido_data.get("sede")
            )
            db.add(new_game)
        
        db.commit()
        return {"success": True, "message": "Partido sincronizado correctamente"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error sincronizando partido: {str(e)}")

@router.get("/health-integration")
async def health_integration():
    """
    Health check específico para integración con .NET
    """
    return {
        "status": "healthy",
        "service": "python-api-integration",
        "timestamp": datetime.utcnow(),
        "endpoints": {
            "partidos_finalizados": "/api/integration/partidos-finalizados",
            "eventos_partido": "/api/integration/partidos/{id}/eventos",
            "estadisticas": "/api/integration/estadisticas/resumen",
            "sync": "/api/integration/sync/partido-desde-dotnet"
        }
    }
