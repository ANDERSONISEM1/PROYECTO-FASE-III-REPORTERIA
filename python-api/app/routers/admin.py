from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..models import Game, Team, GameEvent, Player, User
from ..schemas import (
    Game as GameSchema, 
    GameCreate, 
    GameUpdate,
    Team as TeamSchema,
    TeamCreate,
    TeamUpdate,
    Player as PlayerSchema,
    PlayerCreate,
    PlayerUpdate,
    GameEvent as GameEventSchema,
    GameEventCreate
)
from ..auth import get_current_admin_user

router = APIRouter()

# ==================== PARTIDOS ADMIN ====================

@router.get("/partidos", response_model=List[GameSchema])
async def admin_get_partidos(
    skip: int = 0,
    limit: int = 100,
    estado: Optional[str] = Query(None, description="Filtrar por estado: scheduled, live, finished, suspended"),
    equipo_id: Optional[int] = Query(None, description="Filtrar por equipo"),
    fecha_desde: Optional[str] = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    fecha_hasta: Optional[str] = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Listar todos los partidos con filtros avanzados (solo administradores)
    """
    query = db.query(Game)
    
    if estado:
        query = query.filter(Game.game_status == estado)
    
    if equipo_id:
        query = query.filter(
            (Game.home_team_id == equipo_id) | (Game.away_team_id == equipo_id)
        )
    
    if fecha_desde:
        try:
            fecha_desde_dt = datetime.fromisoformat(fecha_desde)
            query = query.filter(Game.game_date >= fecha_desde_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido para fecha_desde")
    
    if fecha_hasta:
        try:
            fecha_hasta_dt = datetime.fromisoformat(fecha_hasta)
            query = query.filter(Game.game_date <= fecha_hasta_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido para fecha_hasta")
    
    partidos = query.order_by(Game.game_date.desc()).offset(skip).limit(limit).all()
    return partidos

@router.post("/partidos", response_model=GameSchema)
async def admin_create_partido(
    partido: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Crear un nuevo partido (solo administradores)
    """
    # Validar que los equipos existen
    home_team = db.query(Team).filter(Team.id == partido.home_team_id).first()
    away_team = db.query(Team).filter(Team.id == partido.away_team_id).first()
    
    if not home_team or not away_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uno o ambos equipos no existen"
        )
    
    if partido.home_team_id == partido.away_team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los equipos local y visitante no pueden ser el mismo"
        )
    
    db_partido = Game(**partido.dict())
    db.add(db_partido)
    db.commit()
    db.refresh(db_partido)
    
    return db_partido

@router.get("/partidos/{partido_id}", response_model=GameSchema)
async def admin_get_partido(
    partido_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Obtener un partido específico (solo administradores)
    """
    partido = db.query(Game).filter(Game.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    return partido

@router.put("/partidos/{partido_id}", response_model=GameSchema)
async def admin_update_partido(
    partido_id: int,
    partido_update: GameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Actualizar un partido (solo administradores)
    """
    partido = db.query(Game).filter(Game.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    # Actualizar campos
    update_data = partido_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(partido, field, value)
    
    db.commit()
    db.refresh(partido)
    return partido

@router.delete("/partidos/{partido_id}")
async def admin_delete_partido(
    partido_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Eliminar un partido y todos sus eventos (solo administradores)
    """
    partido = db.query(Game).filter(Game.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    # Eliminar eventos relacionados primero
    db.query(GameEvent).filter(GameEvent.game_id == partido_id).delete()
    
    # Eliminar el partido
    db.delete(partido)
    db.commit()
    
    return {"message": f"Partido {partido_id} eliminado correctamente"}

# ==================== CONTROL DE PARTIDOS ====================

@router.post("/partidos/{partido_id}/iniciar")
async def admin_iniciar_partido(
    partido_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Iniciar un partido (cambiar estado a 'live')
    """
    partido = db.query(Game).filter(Game.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    if partido.game_status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede iniciar un partido en estado '{partido.game_status}'"
        )
    
    partido.game_status = "live"
    partido.quarter = 1
    partido.time_remaining = "12:00"
    
    db.commit()
    db.refresh(partido)
    
    # Crear evento de inicio
    evento_inicio = GameEvent(
        game_id=partido_id,
        event_type="game_start",
        event_description="Partido iniciado",
        quarter=1,
        time_in_quarter="12:00"
    )
    db.add(evento_inicio)
    db.commit()
    
    return {"message": "Partido iniciado correctamente", "partido": partido}

@router.post("/partidos/{partido_id}/finalizar")
async def admin_finalizar_partido(
    partido_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Finalizar un partido (cambiar estado a 'finished')
    """
    partido = db.query(Game).filter(Game.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    if partido.game_status not in ["live", "suspended"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede finalizar un partido en estado '{partido.game_status}'"
        )
    
    partido.game_status = "finished"
    partido.time_remaining = "00:00"
    
    db.commit()
    db.refresh(partido)
    
    # Crear evento de finalización
    evento_fin = GameEvent(
        game_id=partido_id,
        event_type="game_end",
        event_description=f"Partido finalizado. Resultado: {partido.home_score}-{partido.away_score}",
        quarter=partido.quarter,
        time_in_quarter="00:00"
    )
    db.add(evento_fin)
    db.commit()
    
    return {"message": "Partido finalizado correctamente", "partido": partido}

@router.post("/partidos/{partido_id}/suspender")
async def admin_suspender_partido(
    partido_id: int,
    razon: str = Query(..., description="Razón de la suspensión"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Suspender un partido
    """
    partido = db.query(Game).filter(Game.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    if partido.game_status != "live":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solo se pueden suspender partidos en vivo"
        )
    
    partido.game_status = "suspended"
    
    db.commit()
    db.refresh(partido)
    
    # Crear evento de suspensión
    evento_suspension = GameEvent(
        game_id=partido_id,
        event_type="game_suspended",
        event_description=f"Partido suspendido. Razón: {razon}",
        quarter=partido.quarter,
        time_in_quarter=partido.time_remaining
    )
    db.add(evento_suspension)
    db.commit()
    
    return {"message": "Partido suspendido correctamente", "partido": partido}

# ==================== EVENTOS DE PARTIDO ====================

@router.get("/partidos/{partido_id}/eventos", response_model=List[GameEventSchema])
async def admin_get_eventos_partido(
    partido_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Obtener todos los eventos de un partido
    """
    # Verificar que el partido existe
    partido = db.query(Game).filter(Game.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    eventos = db.query(GameEvent).filter(
        GameEvent.game_id == partido_id
    ).order_by(GameEvent.created_at.desc()).all()
    
    return eventos

@router.post("/partidos/{partido_id}/eventos", response_model=GameEventSchema)
async def admin_create_evento(
    partido_id: int,
    evento: GameEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Crear un nuevo evento en un partido
    """
    # Verificar que el partido existe
    partido = db.query(Game).filter(Game.id == partido_id).first()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    # Crear el evento
    db_evento = GameEvent(game_id=partido_id, **evento.dict())
    db.add(db_evento)
    
    # Si es un evento de puntuación, actualizar el marcador
    if evento.event_type in ["score", "free_throw", "three_pointer", "two_pointer"] and evento.points > 0:
        if evento.team_id == partido.home_team_id:
            partido.home_score += evento.points
        elif evento.team_id == partido.away_team_id:
            partido.away_score += evento.points
    
    db.commit()
    db.refresh(db_evento)
    
    return db_evento

# ==================== ESTADÍSTICAS ADMIN ====================

@router.get("/estadisticas/dashboard")
async def admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Estadísticas para el dashboard de administración
    """
    total_partidos = db.query(Game).count()
    partidos_programados = db.query(Game).filter(Game.game_status == "scheduled").count()
    partidos_en_vivo = db.query(Game).filter(Game.game_status == "live").count()
    partidos_finalizados = db.query(Game).filter(Game.game_status == "finished").count()
    partidos_suspendidos = db.query(Game).filter(Game.game_status == "suspended").count()
    
    total_equipos = db.query(Team).filter(Team.is_active == True).count()
    total_jugadores = db.query(Player).filter(Player.is_active == True).count()
    total_eventos = db.query(GameEvent).count()
    
    # Últimos partidos
    ultimos_partidos = db.query(Game).order_by(Game.created_at.desc()).limit(5).all()
    
    return {
        "resumen": {
            "total_partidos": total_partidos,
            "partidos_programados": partidos_programados,
            "partidos_en_vivo": partidos_en_vivo,
            "partidos_finalizados": partidos_finalizados,
            "partidos_suspendidos": partidos_suspendidos,
            "total_equipos": total_equipos,
            "total_jugadores": total_jugadores,
            "total_eventos": total_eventos
        },
        "ultimos_partidos": ultimos_partidos,
        "timestamp": datetime.utcnow()
    }

@router.get("/estadisticas/partidos-por-mes")
async def admin_partidos_por_mes(
    año: int = Query(datetime.now().year, description="Año para las estadísticas"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Estadísticas de partidos por mes
    """
    from sqlalchemy import func, extract
    
    stats = db.query(
        extract('month', Game.game_date).label('mes'),
        func.count(Game.id).label('total_partidos'),
        func.sum(func.case([(Game.game_status == 'finished', 1)], else_=0)).label('finalizados'),
        func.sum(func.case([(Game.game_status == 'scheduled', 1)], else_=0)).label('programados')
    ).filter(
        extract('year', Game.game_date) == año
    ).group_by(
        extract('month', Game.game_date)
    ).order_by('mes').all()
    
    return {
        "año": año,
        "estadisticas_por_mes": [
            {
                "mes": stat.mes,
                "total_partidos": stat.total_partidos,
                "finalizados": stat.finalizados,
                "programados": stat.programados
            }
            for stat in stats
        ]
    }
