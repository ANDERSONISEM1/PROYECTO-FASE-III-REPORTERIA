from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Team, User
from ..schemas import Team as TeamSchema, TeamCreate, TeamUpdate
from ..auth import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.get("/", response_model=List[TeamSchema])
async def read_teams(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Team)
    if active_only:
        query = query.filter(Team.is_active == True)
    
    teams = query.offset(skip).limit(limit).all()
    return teams

@router.get("/{team_id}", response_model=TeamSchema)
async def read_team(
    team_id: int,
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/", response_model=TeamSchema)
async def create_team(
    team: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Check if team name already exists
    existing_team = db.query(Team).filter(Team.name == team.name).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name already exists"
        )
    
    db_team = Team(**team.dict())
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@router.put("/{team_id}", response_model=TeamSchema)
async def update_team(
    team_id: int,
    team_update: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if new name already exists (if name is being updated)
    if team_update.name and team_update.name != team.name:
        existing_team = db.query(Team).filter(Team.name == team_update.name).first()
        if existing_team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists"
            )
    
    # Update team fields
    update_data = team_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    
    db.commit()
    db.refresh(team)
    return team

@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Soft delete - just mark as inactive
    team.is_active = False
    db.commit()
    return {"message": "Team deactivated successfully"}

@router.post("/{team_id}/activate")
async def activate_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team.is_active = True
    db.commit()
    return {"message": "Team activated successfully"}
