from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime, date

from ..database import get_db
from ..models import Game, Team, User, GameEvent
from ..schemas import Game as GameSchema, GameCreate, GameUpdate, GameEvent as GameEventSchema, GameEventCreate
from ..auth import get_current_active_user, get_current_admin_user

router = APIRouter()

# WebSocket connection manager for live updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove dead connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

@router.get("/", response_model=List[GameSchema])
async def read_games(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    date_filter: Optional[date] = None,
    team_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Game)
    
    if status_filter:
        query = query.filter(Game.game_status == status_filter)
    
    if date_filter:
        query = query.filter(Game.game_date >= date_filter)
    
    if team_id:
        query = query.filter(
            (Game.home_team_id == team_id) | (Game.away_team_id == team_id)
        )
    
    games = query.offset(skip).limit(limit).all()
    return games

@router.get("/{game_id}", response_model=GameSchema)
async def read_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    game = db.query(Game).filter(Game.id == game_id).first()
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@router.post("/", response_model=GameSchema)
async def create_game(
    game: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Validate teams exist
    home_team = db.query(Team).filter(Team.id == game.home_team_id).first()
    away_team = db.query(Team).filter(Team.id == game.away_team_id).first()
    
    if not home_team or not away_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or both teams not found"
        )
    
    if game.home_team_id == game.away_team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Home and away teams cannot be the same"
        )
    
    db_game = Game(**game.dict())
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game

@router.put("/{game_id}", response_model=GameSchema)
async def update_game(
    game_id: int,
    game_update: GameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    game = db.query(Game).filter(Game.id == game_id).first()
    if game is None:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Update game fields
    update_data = game_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(game, field, value)
    
    db.commit()
    db.refresh(game)
    
    # Broadcast live update if game is live
    if game.game_status == "live":
        await manager.broadcast(f"Game {game_id} updated: {game.home_score}-{game.away_score}")
    
    return game

@router.post("/{game_id}/events", response_model=GameEventSchema)
async def create_game_event(
    game_id: int,
    event: GameEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Validate game exists
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Create event
    db_event = GameEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Broadcast live update
    await manager.broadcast(f"Game {game_id} event: {event.event_type}")
    
    return db_event

@router.get("/{game_id}/events", response_model=List[GameEventSchema])
async def read_game_events(
    game_id: int,
    db: Session = Depends(get_db)
):
    events = db.query(GameEvent).filter(GameEvent.game_id == game_id).order_by(GameEvent.created_at.desc()).all()
    return events

@router.post("/{game_id}/start")
async def start_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game.game_status != "scheduled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Game can only be started if it's scheduled"
        )
    
    game.game_status = "live"
    game.quarter = 1
    game.time_remaining = "12:00"
    db.commit()
    
    await manager.broadcast(f"Game {game_id} started!")
    return {"message": "Game started successfully"}

@router.post("/{game_id}/finish")
async def finish_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game.game_status = "finished"
    game.time_remaining = "00:00"
    db.commit()
    
    await manager.broadcast(f"Game {game_id} finished! Final score: {game.home_score}-{game.away_score}")
    return {"message": "Game finished successfully"}

@router.websocket("/{game_id}/live")
async def websocket_endpoint(websocket: WebSocket, game_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"Connected to game {game_id} live updates", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
