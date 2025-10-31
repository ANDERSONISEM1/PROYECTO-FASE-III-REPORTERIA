from fastapi import APIRouter, Depends, HTTPException, status
from app.data.partido_data import PartidoDataAccess
from app.dependencies import get_partido_data_access

router = APIRouter()

@router.get("/kpis")
async def get_kpis(
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
):
    """Obtiene KPIs para el dashboard"""
    try:
        with data_access.get_connection() as conn:
            cursor = conn.cursor()
            
            # Total equipos
            cursor.execute("SELECT COUNT(*) FROM dbo.Equipo WHERE activo = 1")
            total_equipos = cursor.fetchone()[0]
            
            # Total jugadores
            cursor.execute("SELECT COUNT(*) FROM dbo.Jugador WHERE activo = 1")
            total_jugadores = cursor.fetchone()[0]
            
            # Partidos pendientes (programados)
            cursor.execute("SELECT COUNT(*) FROM dbo.Partido WHERE estado = 'programado'")
            partidos_pendientes = cursor.fetchone()[0]
            
            return {
                "totalEquipos": total_equipos,
                "totalJugadores": total_jugadores,
                "partidosPendientes": partidos_pendientes
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener KPIs: {str(e)}"
        )

@router.get("/proximo")
async def get_proximo_partido(
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
):
    """Obtiene el próximo partido programado"""
    try:
        with data_access.get_connection() as conn:
            cursor = conn.cursor()
            
            # Buscar próximo partido programado
            cursor.execute("""
                SELECT TOP 1 
                    partido_id,
                    equipo_local_id,
                    equipo_visitante_id,
                    fecha_hora_inicio,
                    sede,
                    estado
                FROM dbo.Partido 
                WHERE estado = 'programado' 
                    AND fecha_hora_inicio >= GETDATE()
                ORDER BY fecha_hora_inicio ASC
            """)
            
            partido = cursor.fetchone()
            
            if not partido:
                # No hay próximo partido - retornar 204 No Content
                return None
            
            return {
                "id": partido[0],
                "equipoLocalId": partido[1],
                "equipoVisitanteId": partido[2],
                "fechaHoraInicio": partido[3].isoformat() if partido[3] else None,
                "sede": partido[4],
                "estado": partido[5]
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener próximo partido: {str(e)}"
        )
