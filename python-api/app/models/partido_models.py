from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

# Tipos de estado del partido
EstadoPartido = Literal["programado", "en_curso", "finalizado", "cancelado", "suspendido"]

class PartidoBase(BaseModel):
    """Modelo base para Partido"""
    equipo_local_id: int = Field(..., description="ID del equipo local")
    equipo_visitante_id: int = Field(..., description="ID del equipo visitante")
    fecha_hora_inicio: Optional[datetime] = Field(None, description="Fecha y hora de inicio del partido")
    estado: EstadoPartido = Field("programado", description="Estado del partido")
    minutos_por_cuarto: int = Field(10, ge=1, le=15, description="Minutos por cuarto")
    cuartos_totales: int = Field(4, ge=4, description="Número total de cuartos")
    faltas_por_equipo_limite: int = Field(5, ge=1, le=255, description="Límite de faltas por equipo")
    faltas_por_jugador_limite: int = Field(5, ge=1, le=255, description="Límite de faltas por jugador")
    sede: Optional[str] = Field(None, max_length=100, description="Sede del partido")

class CreatePartidoRequest(BaseModel):
    """Request para crear un partido - Flexible para frontend"""
    equipoLocalId: int = Field(..., description="ID del equipo local")
    equipoVisitanteId: int = Field(..., description="ID del equipo visitante") 
    fechaHoraInicio: Optional[str] = Field(None, description="Fecha y hora de inicio (ISO string)")
    estado: EstadoPartido = Field("programado", description="Estado del partido")
    minutosPorCuarto: int = Field(10, ge=1, le=15, description="Minutos por cuarto")
    cuartosTotales: int = Field(4, ge=4, description="Número total de cuartos")
    faltasPorEquipoLimite: int = Field(5, ge=1, le=255, description="Límite de faltas por equipo")
    faltasPorJugadorLimite: int = Field(5, ge=1, le=255, description="Límite de faltas por jugador")
    sede: Optional[str] = Field(None, max_length=100, description="Sede del partido")

class UpdatePartidoRequest(BaseModel):
    """Request para actualizar un partido - Compatible con frontend"""
    equipoLocalId: int = Field(..., description="ID del equipo local")
    equipoVisitanteId: int = Field(..., description="ID del equipo visitante") 
    fechaHoraInicio: Optional[str] = Field(None, description="Fecha y hora de inicio (ISO string)")
    estado: EstadoPartido = Field("programado", description="Estado del partido")
    minutosPorCuarto: int = Field(10, ge=1, le=15, description="Minutos por cuarto")
    cuartosTotales: int = Field(4, ge=4, description="Número total de cuartos")
    faltasPorEquipoLimite: int = Field(5, ge=1, le=255, description="Límite de faltas por equipo")
    faltasPorJugadorLimite: int = Field(5, ge=1, le=255, description="Límite de faltas por jugador")
    sede: Optional[str] = Field(None, max_length=100, description="Sede del partido")

class PartidoResponse(PartidoBase):
    """Response de un partido"""
    id: int = Field(..., description="ID del partido")
    fecha_creacion: datetime = Field(..., description="Fecha de creación")
    
    class Config:
        from_attributes = True

class PartidoDto(BaseModel):
    """DTO para compatibilidad con frontend"""
    id: int
    equipoLocalId: int
    equipoVisitanteId: int
    fechaHoraInicio: Optional[str] = None
    estado: EstadoPartido
    minutosPorCuarto: int
    cuartosTotales: int
    faltasPorEquipoLimite: int
    faltasPorJugadorLimite: int
    sede: Optional[str] = None
    fechaCreacion: str
    puntosLocal: int = 0
    puntosVisitante: int = 0

# Modelos para Roster
class RosterEntryBase(BaseModel):
    """Modelo base para entrada del roster"""
    partido_id: int = Field(..., description="ID del partido")
    equipo_id: int = Field(..., description="ID del equipo")
    jugador_id: int = Field(..., description="ID del jugador")
    es_titular: bool = Field(False, description="Si es jugador titular")

class CreateRosterEntry(RosterEntryBase):
    """Request para crear entrada del roster"""
    pass

class RosterEntryResponse(RosterEntryBase):
    """Response de entrada del roster"""
    roster_id: int = Field(..., description="ID del roster")
    
    class Config:
        from_attributes = True

class SaveRosterRequest(BaseModel):
    """Request para guardar roster completo"""
    partidoId: int
    items: List[dict]  # Lista de items del roster

class RosterEntryDto(BaseModel):
    """DTO para compatibilidad con frontend"""
    partidoId: int
    equipoId: int
    jugadorId: int
    esTitular: bool

# Modelos para historial (estadísticas del partido)
class EstadisticaPartidoBase(BaseModel):
    """Modelo base para estadísticas del partido"""
    partido_id: int = Field(..., description="ID del partido")
    equipo_id: int = Field(..., description="ID del equipo")
    jugador_id: Optional[int] = Field(None, description="ID del jugador (opcional)")
    puntos: int = Field(0, ge=0, description="Puntos anotados")
    rebotes: int = Field(0, ge=0, description="Rebotes")
    asistencias: int = Field(0, ge=0, description="Asistencias")
    faltas: int = Field(0, ge=0, description="Faltas cometidas")
    minutos_jugados: int = Field(0, ge=0, description="Minutos jugados")

class CreateEstadisticaRequest(EstadisticaPartidoBase):
    """Request para crear estadística"""
    pass

class EstadisticaPartidoResponse(EstadisticaPartidoBase):
    """Response de estadística del partido"""
    id: int = Field(..., description="ID de la estadística")
    fecha_creacion: datetime = Field(..., description="Fecha de creación")
    
    class Config:
        from_attributes = True

# Modelos para resumen del partido
class ResumenPartido(BaseModel):
    """Resumen completo del partido"""
    partido: PartidoResponse
    roster_local: List[RosterEntryResponse]
    roster_visitante: List[RosterEntryResponse]
    estadisticas: List[EstadisticaPartidoResponse]
    puntos_local: int = 0
    puntos_visitante: int = 0
