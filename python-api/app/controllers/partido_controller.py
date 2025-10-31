from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Dict, Any
from datetime import datetime
from app.models.partido_models import (
    PartidoDto, CreatePartidoRequest, UpdatePartidoRequest,
    SaveRosterRequest, RosterEntryDto
)
from app.data.partido_data import PartidoDataAccess
# from app.auth import get_current_user  # Temporarily disabled for testing

router = APIRouter(prefix="/api/admin/partidos", tags=["partidos"])

@router.get("/test")
async def test_endpoint():
    """Endpoint de prueba simple"""
    return {"message": "Python API funcionando correctamente", "status": "OK"}

@router.get("/test-db")
async def test_database():
    """Endpoint de prueba de conexión a base de datos"""
    try:
        data_access = PartidoDataAccess()
        # Intentar una consulta simple
        with data_access.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 as test")
            result = cursor.fetchone()
            return {"message": "Conexión a base de datos exitosa", "status": "OK", "test_result": result[0]}
    except Exception as e:
        return {"message": "Error de conexión a base de datos", "status": "ERROR", "error": str(e)}

@router.post("/debug")
async def debug_create_partido(request_data: dict):
    """Endpoint de debug para ver qué datos llegan del frontend"""
    print(f"DEBUG RAW DATA: {request_data}")
    return {"received_data": request_data, "status": "DEBUG"}

def get_partido_data_access():
    """Dependency para obtener acceso a datos de partidos"""
    return PartidoDataAccess()

@router.get("/", response_model=List[PartidoDto])
async def get_all_partidos(
    data_access: PartidoDataAccess = Depends(get_partido_data_access)
    # current_user: dict = Depends(get_current_user)  # Temporarily disabled
):
    """Obtiene todos los partidos"""
    try:
        print("DEBUG GET ALL: Starting to get all partidos")
        partidos = data_access.get_all_partidos()
        print(f"DEBUG GET ALL: Retrieved {len(partidos)} partidos from database")
        
        # Convertir a DTOs para el frontend
        partidos_dto = []
        for i, partido in enumerate(partidos):
            try:
                print(f"DEBUG GET ALL: Processing partido {i}: {partido}")
                dto = PartidoDto(
                    id=partido.get('partido_id') or partido.get('id'),
                    equipoLocalId=partido['equipo_local_id'],
                    equipoVisitanteId=partido['equipo_visitante_id'],
                    fechaHoraInicio=partido['fecha_hora_inicio'],  # Ya es string desde data layer
                    estado=partido['estado'],
                    minutosPorCuarto=partido['minutos_por_cuarto'],
                    cuartosTotales=partido['cuartos_totales'],
                    faltasPorEquipoLimite=partido['faltas_por_equipo_limite'],
                    faltasPorJugadorLimite=partido['faltas_por_jugador_limite'],
                    sede=partido['sede'],
                    fechaCreacion=partido['fecha_creacion']  # Ya es string desde data layer
                )
                partidos_dto.append(dto)
                print(f"DEBUG GET ALL: Successfully processed partido {i}")
            except Exception as dto_error:
                print(f"DEBUG GET ALL: Error processing partido {i}: {dto_error}")
                print(f"DEBUG GET ALL: Partido data: {partido}")
                raise
        
        print(f"DEBUG GET ALL: Successfully converted {len(partidos_dto)} partidos to DTOs")
        return partidos_dto
        
    except Exception as e:
        print(f"DEBUG GET ALL: Error in get_all_partidos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener partidos: {str(e)}"
        )

@router.get("/historial", response_model=List[PartidoDto])
async def get_historial_partidos(
    data_access: PartidoDataAccess = Depends(get_partido_data_access)
    # current_user: dict = Depends(get_current_user)  # Temporarily disabled
):
    """Obtiene el historial de partidos finalizados"""
    try:
        print("DEBUG HISTORIAL: Getting finalized matches")
        partidos = data_access.get_partidos_by_estado("finalizado")
        
        # Convertir a DTOs para el frontend
        partidos_dto = []
        for partido in partidos:
            dto = PartidoDto(
                id=partido['partido_id'],
                equipoLocalId=partido['equipo_local_id'],
                equipoVisitanteId=partido['equipo_visitante_id'],
                fechaHoraInicio=partido['fecha_hora_inicio'],  # Ya es string desde data layer
                estado=partido['estado'],
                minutosPorCuarto=partido['minutos_por_cuarto'],
                cuartosTotales=partido['cuartos_totales'],
                faltasPorEquipoLimite=partido['faltas_por_equipo_limite'],
                faltasPorJugadorLimite=partido['faltas_por_jugador_limite'],
                sede=partido['sede'],
                fechaCreacion=partido['fecha_creacion'],  # Ya es string desde data layer
                puntosLocal=partido['puntos_local'],
                puntosVisitante=partido['puntos_visitante']
            )
            partidos_dto.append(dto)
        
        print(f"DEBUG HISTORIAL: Found {len(partidos_dto)} finalized matches")
        return partidos_dto
        
    except Exception as e:
        print(f"DEBUG HISTORIAL: Error getting historial: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historial: {str(e)}"
        )

@router.get("/{partido_id}", response_model=PartidoDto)
async def get_partido_by_id(
    partido_id: int,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
    # current_user: dict = Depends(get_current_user)  # Temporarily disabled
):
    """Obtiene un partido por ID"""
    try:
        partido = data_access.get_partido_by_id(partido_id)
        
        if not partido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        # Convertir a DTO
        dto = PartidoDto(
            id=partido['id'],
            equipoLocalId=partido['equipo_local_id'],
            equipoVisitanteId=partido['equipo_visitante_id'],
            fechaHoraInicio=partido['fecha_hora_inicio'],
            estado=partido['estado'],
            minutosPorCuarto=partido['minutos_por_cuarto'],
            cuartosTotales=partido['cuartos_totales'],
            faltasPorEquipoLimite=partido['faltas_por_equipo_limite'],
            faltasPorJugadorLimite=partido['faltas_por_jugador_limite'],
            sede=partido['sede'],
            fechaCreacion=partido['fecha_creacion']
        )
        
        return dto
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener partido: {str(e)}"
        )

@router.post("/start")
async def start_partido(request_data: dict):
    """Crear/iniciar un nuevo partido"""
    try:
        equipo_local_id = request_data.get("equipoLocalId")
        equipo_visitante_id = request_data.get("equipoVisitanteId")
        
        if not equipo_local_id or not equipo_visitante_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="equipoLocalId y equipoVisitanteId son requeridos"
            )
        
        data_access = PartidoDataAccess()
        
        # Crear objeto con la estructura que espera create_partido
        from types import SimpleNamespace
        partido_data = SimpleNamespace(
            equipo_local_id=equipo_local_id,
            equipo_visitante_id=equipo_visitante_id,
            fecha_hora_inicio=datetime.now().isoformat(),
            estado="programado",
            minutos_por_cuarto=10,
            cuartos_totales=4,
            faltas_por_equipo_limite=5,
            faltas_por_jugador_limite=5,
            sede="Cancha Principal"
        )
        
        partido_id = data_access.create_partido(partido_data)
        
        # Obtener datos de equipos para la respuesta
        with data_access.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT equipo_id, nombre, abreviatura FROM Equipo WHERE equipo_id IN (?, ?)", 
                         (equipo_local_id, equipo_visitante_id))
            equipos = cursor.fetchall()
            
            equipos_dict = {}
            for equipo in equipos:
                equipos_dict[equipo[0]] = {
                    "id": equipo[0],
                    "nombre": equipo[1],
                    "abreviatura": equipo[2] or ""
                }
        
        return {
            "partidoId": partido_id,
            "estado": "programado",
            "local": equipos_dict.get(equipo_local_id, {"id": equipo_local_id, "nombre": "Equipo Local", "abreviatura": ""}),
            "visitante": equipos_dict.get(equipo_visitante_id, {"id": equipo_visitante_id, "nombre": "Equipo Visitante", "abreviatura": ""})
        }
        
    except Exception as e:
        print(f"ERROR en start_partido: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear partido: {str(e)}"
        )

@router.post("/", response_model=PartidoDto, status_code=status.HTTP_201_CREATED)
async def create_partido(
    partido_request: CreatePartidoRequest,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
    # current_user: dict = Depends(get_current_user)  # Temporarily disabled
):
    """Crea un nuevo partido"""
    try:
        print(f"DEBUG: Received partido_request: {partido_request}")
        print(f"DEBUG: Request dict: {partido_request.dict()}")
        
        # Validar que los equipos sean diferentes
        if partido_request.equipoLocalId == partido_request.equipoVisitanteId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El equipo local y visitante deben ser diferentes"
            )
        
        # Convertir datos del frontend al formato de base de datos
        from app.models.partido_models import PartidoBase
        partido_data = PartidoBase(
            equipo_local_id=partido_request.equipoLocalId,
            equipo_visitante_id=partido_request.equipoVisitanteId,
            fecha_hora_inicio=datetime.fromisoformat(partido_request.fechaHoraInicio.replace('Z', '+00:00')) if partido_request.fechaHoraInicio else None,
            estado=partido_request.estado,
            minutos_por_cuarto=partido_request.minutosPorCuarto,
            cuartos_totales=partido_request.cuartosTotales,
            faltas_por_equipo_limite=partido_request.faltasPorEquipoLimite,
            faltas_por_jugador_limite=partido_request.faltasPorJugadorLimite,
            sede=partido_request.sede
        )
        
        # Crear el partido
        partido_id = data_access.create_partido(partido_data)
        
        # Obtener el partido creado
        partido_creado = data_access.get_partido_by_id(partido_id)
        
        if not partido_creado:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear el partido"
            )
        
        # Convertir a DTO
        dto = PartidoDto(
            id=partido_creado['id'],
            equipoLocalId=partido_creado['equipo_local_id'],
            equipoVisitanteId=partido_creado['equipo_visitante_id'],
            fechaHoraInicio=partido_creado['fecha_hora_inicio'],
            estado=partido_creado['estado'],
            minutosPorCuarto=partido_creado['minutos_por_cuarto'],
            cuartosTotales=partido_creado['cuartos_totales'],
            faltasPorEquipoLimite=partido_creado['faltas_por_equipo_limite'],
            faltasPorJugadorLimite=partido_creado['faltas_por_jugador_limite'],
            sede=partido_creado['sede'],
            fechaCreacion=partido_creado['fecha_creacion']
        )
        
        return dto
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear partido: {str(e)}"
        )

@router.put("/{partido_id}", response_model=PartidoDto)
async def update_partido(
    partido_id: int,
    partido_request: UpdatePartidoRequest,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
    # current_user: dict = Depends(get_current_user)  # Temporarily disabled
):
    """Actualiza un partido existente"""
    try:
        print(f"DEBUG UPDATE: Received partido_request: {partido_request}")
        print(f"DEBUG UPDATE: Request dict: {partido_request.dict()}")
        
        # Validar que el partido existe
        partido_existente = data_access.get_partido_by_id(partido_id)
        if not partido_existente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        # Validar que los equipos sean diferentes
        if partido_request.equipoLocalId == partido_request.equipoVisitanteId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El equipo local y visitante deben ser diferentes"
            )
        
        # Convertir datos del frontend al formato de base de datos
        try:
            from app.models.partido_models import PartidoBase
            print(f"DEBUG UPDATE: Converting data to PartidoBase format")
            
            fecha_convertida = None
            if partido_request.fechaHoraInicio:
                try:
                    fecha_convertida = datetime.fromisoformat(partido_request.fechaHoraInicio.replace('Z', '+00:00'))
                    print(f"DEBUG UPDATE: Converted date: {fecha_convertida}")
                except Exception as date_error:
                    print(f"DEBUG UPDATE: Date conversion error: {date_error}")
                    fecha_convertida = None
            
            partido_data = PartidoBase(
                equipo_local_id=partido_request.equipoLocalId,
                equipo_visitante_id=partido_request.equipoVisitanteId,
                fecha_hora_inicio=fecha_convertida,
                estado=partido_request.estado,
                minutos_por_cuarto=partido_request.minutosPorCuarto,
                cuartos_totales=partido_request.cuartosTotales,
                faltas_por_equipo_limite=partido_request.faltasPorEquipoLimite,
                faltas_por_jugador_limite=partido_request.faltasPorJugadorLimite,
                sede=partido_request.sede
            )
            print(f"DEBUG UPDATE: PartidoBase created successfully")
        except Exception as conversion_error:
            print(f"DEBUG UPDATE: Error creating PartidoBase: {conversion_error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error al convertir datos: {str(conversion_error)}"
            )
        
        # Actualizar el partido
        try:
            print(f"DEBUG UPDATE: Calling data_access.update_partido")
            success = data_access.update_partido(partido_id, partido_data)
            print(f"DEBUG UPDATE: Update result: {success}")
        except Exception as update_error:
            print(f"DEBUG UPDATE: Error updating partido: {update_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al actualizar partido en base de datos: {str(update_error)}"
            )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar el partido"
            )
        
        # Obtener el partido actualizado
        try:
            print(f"DEBUG UPDATE: Getting updated partido {partido_id}")
            partido_actualizado = data_access.get_partido_by_id(partido_id)
            print(f"DEBUG UPDATE: Retrieved partido: {partido_actualizado}")
            
            if not partido_actualizado:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al obtener el partido actualizado"
                )
            
            # Convertir a DTO para el frontend
            print(f"DEBUG UPDATE: Creating DTO")
            dto = PartidoDto(
                id=partido_actualizado.get('partido_id') or partido_actualizado.get('id'),
                equipoLocalId=partido_actualizado['equipo_local_id'],
                equipoVisitanteId=partido_actualizado['equipo_visitante_id'],
                fechaHoraInicio=partido_actualizado['fecha_hora_inicio'],  # Ya es string desde data layer
                estado=partido_actualizado['estado'],
                minutosPorCuarto=partido_actualizado['minutos_por_cuarto'],
                cuartosTotales=partido_actualizado['cuartos_totales'],
                faltasPorEquipoLimite=partido_actualizado['faltas_por_equipo_limite'],
                faltasPorJugadorLimite=partido_actualizado['faltas_por_jugador_limite'],
                sede=partido_actualizado['sede'],
                fechaCreacion=partido_actualizado['fecha_creacion']  # Ya es string desde data layer
            )
            print(f"DEBUG UPDATE: DTO created successfully")
            
            return dto
        except Exception as dto_error:
            print(f"DEBUG UPDATE: Error creating DTO: {dto_error}")
            print(f"DEBUG UPDATE: Partido data: {partido_actualizado}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al procesar partido actualizado: {str(dto_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar partido: {str(e)}"
        )

@router.delete("/{partido_id}")
async def delete_partido(
    partido_id: int,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
    # current_user: dict = Depends(get_current_user)  # Temporarily disabled
):
    """Elimina un partido"""
    try:
        print(f"DEBUG DELETE: Attempting to delete partido with ID: {partido_id}")
        
        # Validar que el partido existe
        partido_existente = data_access.get_partido_by_id(partido_id)
        if not partido_existente:
            print(f"DEBUG DELETE: Partido {partido_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        print(f"DEBUG DELETE: Found partido {partido_id}, proceeding with deletion")
        
        # Eliminar el partido
        success = data_access.delete_partido(partido_id)
        
        if not success:
            print(f"DEBUG DELETE: Failed to delete partido {partido_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al eliminar el partido"
            )
        
        print(f"DEBUG DELETE: Successfully deleted partido {partido_id}")
        return {"message": "Partido eliminado exitosamente", "partidoId": partido_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG DELETE: Exception occurred: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar partido: {str(e)}"
        )

@router.patch("/{partido_id}/estado")
async def update_partido_estado(
    partido_id: int,
    estado_data: dict,
    data_access: PartidoDataAccess = Depends(get_partido_data_access)
):
    """Actualiza solo el estado de un partido"""
    try:
        print(f"DEBUG UPDATE ESTADO: Updating partido {partido_id} to estado: {estado_data}")
        
        # Validar que el partido existe
        partido_existente = data_access.get_partido_by_id(partido_id)
        if not partido_existente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        # Validar estado
        estados_validos = ["programado", "en_curso", "finalizado", "cancelado", "suspendido"]
        nuevo_estado = estado_data.get("estado")
        
        if not nuevo_estado or nuevo_estado not in estados_validos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}"
            )
        
        # Actualizar solo el estado
        success = data_access.update_partido_estado(partido_id, nuevo_estado)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar el estado del partido"
            )
        
        print(f"DEBUG UPDATE ESTADO: Successfully updated partido {partido_id} to {nuevo_estado}")
        return {"message": "Estado actualizado exitosamente", "partidoId": partido_id, "nuevoEstado": nuevo_estado}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG UPDATE ESTADO: Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar estado: {str(e)}"
        )

# Endpoints para Roster
@router.get("/{partido_id}/roster")
async def get_roster_partido(
    partido_id: int,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
    # current_user: dict = Depends(get_current_user)  # Temporarily disabled
):
    """Obtiene el roster de un partido"""
    try:
        # Validar que el partido existe
        partido_existente = data_access.get_partido_by_id(partido_id)
        if not partido_existente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        roster_data = data_access.get_roster_by_partido(partido_id)
        
        # Convertir a formato esperado por el frontend
        roster_dto = []
        for entry in roster_data:
            dto = {
                "partidoId": entry['partido_id'],
                "equipoId": entry['equipo_id'],
                "jugadorId": entry['jugador_id'],
                "esTitular": entry['es_titular']
            }
            roster_dto.append(dto)
        
        return roster_dto
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener roster: {str(e)}"
        )

@router.put("/{partido_id}/roster")
async def save_roster_partido(
    partido_id: int,
    roster_request: SaveRosterRequest,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
    # current_user: dict = Depends(get_current_user)  # Temporarily disabled
):
    """Guarda el roster completo de un partido"""
    try:
        # Validar que el partido existe
        partido_existente = data_access.get_partido_by_id(partido_id)
        if not partido_existente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        # Validar que el partido_id coincide
        if roster_request.partidoId != partido_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El ID del partido no coincide"
            )
        
        # Guardar el roster
        success = data_access.save_roster_complete(partido_id, roster_request.items)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al guardar el roster"
            )
        
        return {"message": "Roster guardado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al guardar roster: {str(e)}"
        )

@router.patch("/{partido_id}/estado")
async def update_estado_partido(
    partido_id: int,
    request_data: dict,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
):
    """Actualiza el estado de un partido"""
    try:
        # Validar que el partido existe
        partido_existente = data_access.get_partido_by_id(partido_id)
        if not partido_existente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        nuevo_estado = request_data.get("estado")
        if not nuevo_estado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Estado es requerido"
            )
        
        # Actualizar estado en base de datos
        with data_access.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE dbo.Partido SET estado = ? WHERE partido_id = ?",
                (nuevo_estado, partido_id)
            )
            conn.commit()
            
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se pudo actualizar el partido"
                )
        
        return {"message": f"Estado actualizado a '{nuevo_estado}' exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar estado: {str(e)}"
        )

@router.post("/{partido_id}/anotaciones/ajustar")
async def ajustar_puntos_partido(
    partido_id: int,
    request_data: dict,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
):
    """Ajusta puntos de un equipo en un partido"""
    try:
        # Validar que el partido existe
        partido_existente = data_access.get_partido_by_id(partido_id)
        if not partido_existente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        equipo_id = request_data.get("equipoId")
        puntos = request_data.get("puntos")
        
        if not equipo_id or puntos is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="equipoId y puntos son requeridos"
            )
        
        # Obtener marcador actual
        with data_access.get_connection() as conn:
            cursor = conn.cursor()
            
            # Obtener puntos actuales
            cursor.execute("""
                SELECT 
                    ISNULL(SUM(CASE WHEN equipo_id = ? THEN puntos ELSE 0 END), 0) as puntos_equipo,
                    ISNULL(SUM(CASE WHEN equipo_id != ? THEN puntos ELSE 0 END), 0) as puntos_otro
                FROM dbo.Anotacion 
                WHERE partido_id = ?
            """, (equipo_id, equipo_id, partido_id))
            
            result = cursor.fetchone()
            puntos_actuales_equipo = result[0] if result else 0
            puntos_otro_equipo = result[1] if result else 0
            
            # Insertar nueva anotación
            cursor.execute("""
                INSERT INTO dbo.Anotacion (partido_id, equipo_id, jugador_id, puntos, descripcion, fecha_hora)
                VALUES (?, ?, NULL, ?, 'Ajuste manual', GETDATE())
            """, (partido_id, equipo_id, puntos))
            
            conn.commit()
            
            # Calcular nuevo marcador
            nuevos_puntos_equipo = puntos_actuales_equipo + puntos
            
            # Determinar cuál equipo es local y cuál visitante
            cursor.execute("""
                SELECT equipo_local_id, equipo_visitante_id 
                FROM dbo.Partido 
                WHERE partido_id = ?
            """, (partido_id,))
            
            partido_info = cursor.fetchone()
            equipo_local_id = partido_info[0]
            equipo_visitante_id = partido_info[1]
            
            if equipo_id == equipo_local_id:
                puntos_local = nuevos_puntos_equipo
                puntos_visitante = puntos_otro_equipo
            else:
                puntos_local = puntos_otro_equipo  
                puntos_visitante = nuevos_puntos_equipo
        
        # Retornar marcador actualizado
        return {
            "partidoId": partido_id,
            "local": puntos_local,
            "visitante": puntos_visitante
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ajustar puntos: {str(e)}"
        )

@router.delete("/{partido_id}/reset")
async def reset_partido_completo(
    partido_id: int,
    data_access: PartidoDataAccess = Depends(get_partido_data_access),
):
    """Elimina TODOS los datos del partido de TODAS las tablas"""
    try:
        # Validar que el partido existe
        partido_existente = data_access.get_partido_by_id(partido_id)
        if not partido_existente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Partido no encontrado"
            )
        
        with data_access.get_connection() as conn:
            cursor = conn.cursor()
            
            # Eliminar en orden correcto (respetando foreign keys)
            
            # 1. Eliminar roster del partido
            cursor.execute("DELETE FROM dbo.RosterPartido WHERE partido_id = ?", (partido_id,))
            
            # 2. Eliminar anotaciones del partido
            cursor.execute("DELETE FROM dbo.Anotacion WHERE partido_id = ?", (partido_id,))
            
            # 3. Eliminar faltas del partido (si existe tabla)
            try:
                cursor.execute("DELETE FROM dbo.Falta WHERE partido_id = ?", (partido_id,))
            except:
                pass  # Tabla puede no existir
            
            # 4. Eliminar tiempos muertos del partido (si existe tabla)
            try:
                cursor.execute("DELETE FROM dbo.TiempoMuerto WHERE partido_id = ?", (partido_id,))
            except:
                pass  # Tabla puede no existir
            
            # 5. Eliminar cuartos del partido (si existe tabla)
            try:
                cursor.execute("DELETE FROM dbo.Cuarto WHERE partido_id = ?", (partido_id,))
            except:
                pass  # Tabla puede no existir
            
            # 6. Eliminar eventos del partido (si existe tabla)
            try:
                cursor.execute("DELETE FROM dbo.EventoPartido WHERE partido_id = ?", (partido_id,))
            except:
                pass  # Tabla puede no existir
            
            # 7. Finalmente eliminar el partido
            cursor.execute("DELETE FROM dbo.Partido WHERE partido_id = ?", (partido_id,))
            
            conn.commit()
            
            # Verificar que se eliminó
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se pudo eliminar el partido"
                )
        
        return {"message": "Partido y todos sus datos eliminados exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar partido: {str(e)}"
        )
