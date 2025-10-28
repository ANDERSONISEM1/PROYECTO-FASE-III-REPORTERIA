from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Team schemas
class TeamBase(BaseModel):
    name: str
    city: Optional[str] = None
    logo_url: Optional[str] = None
    founded_year: Optional[int] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    logo_url: Optional[str] = None
    founded_year: Optional[int] = None
    is_active: Optional[bool] = None

class Team(TeamBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Game schemas
class GameBase(BaseModel):
    home_team_id: int
    away_team_id: int
    game_date: datetime
    venue: Optional[str] = None

class GameCreate(GameBase):
    pass

class GameUpdate(BaseModel):
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    quarter: Optional[int] = None
    time_remaining: Optional[str] = None
    game_status: Optional[str] = None
    venue: Optional[str] = None

class Game(GameBase):
    id: int
    home_score: int
    away_score: int
    quarter: int
    time_remaining: str
    game_status: str
    created_at: datetime
    updated_at: datetime
    home_team: Optional[Team] = None
    away_team: Optional[Team] = None

    class Config:
        from_attributes = True

# Player schemas
class PlayerBase(BaseModel):
    team_id: int
    name: str
    jersey_number: int
    position: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None

class PlayerCreate(PlayerBase):
    pass

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    jersey_number: Optional[int] = None
    position: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    is_active: Optional[bool] = None

class Player(PlayerBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    team: Optional[Team] = None

    class Config:
        from_attributes = True

# Game Event schemas
class GameEventBase(BaseModel):
    game_id: int
    team_id: Optional[int] = None
    event_type: str
    event_description: Optional[str] = None
    points: Optional[int] = 0
    quarter: Optional[int] = None
    time_in_quarter: Optional[str] = None

class GameEventCreate(GameEventBase):
    pass

class GameEvent(GameEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str
