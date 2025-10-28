import pyodbc
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.config import get_settings
from app.models.partido_models import (
    PartidoResponse, CreatePartidoRequest, UpdatePartidoRequest,
    RosterEntryResponse, CreateRosterEntry, EstadisticaPartidoResponse
)

class PartidoDataAccess:
    """Capa de acceso a datos para partidos"""
    
    def __init__(self):
        self.settings = get_settings()
    
    def get_connection(self) -> pyodbc.Connection:
        """Obtiene conexión a la base de datos"""
        return pyodbc.connect(
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={self.settings.sqlserver_host},{self.settings.sqlserver_port};"
            f"DATABASE={self.settings.sqlserver_database};"
            f"UID={self.settings.sqlserver_username};"
            f"PWD={self.settings.sqlserver_password};"
            f"TrustServerCertificate=yes;"
        )
    
    def get_all_partidos(self) -> List[Dict[str, Any]]:
        """Obtiene todos los partidos"""
        query = """
        SELECT 
            partido_id as id,
            equipo_local_id,
            equipo_visitante_id,
            fecha_hora_inicio,
            estado,
            minutos_por_cuarto,
            cuartos_totales,
            faltas_por_equipo_limite,
            faltas_por_jugador_limite,
            sede,
            fecha_creacion
        FROM dbo.Partido
        ORDER BY fecha_creacion DESC
        """
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                partido = dict(zip(columns, row))
                # Convertir datetime a string para JSON
                if partido['fecha_hora_inicio']:
                    partido['fecha_hora_inicio'] = partido['fecha_hora_inicio'].isoformat()
                if partido['fecha_creacion']:
                    partido['fecha_creacion'] = partido['fecha_creacion'].isoformat()
                results.append(partido)
            
            return results
    
    def get_partidos_by_estado(self, estado: str) -> List[Dict[str, Any]]:
        """Obtiene partidos por estado específico"""
        query = """
        SELECT 
            partido_id,
            equipo_local_id,
            equipo_visitante_id,
            fecha_hora_inicio,
            estado,
            minutos_por_cuarto,
            cuartos_totales,
            faltas_por_equipo_limite,
            faltas_por_jugador_limite,
            sede,
            fecha_creacion
        FROM dbo.Partido
        WHERE estado = ?
        ORDER BY fecha_creacion DESC
        """
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (estado,))
            
            columns = [column[0] for column in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                result = dict(zip(columns, row))
                # Convertir datetime a string para JSON
                if result['fecha_hora_inicio']:
                    result['fecha_hora_inicio'] = result['fecha_hora_inicio'].isoformat()
                if result['fecha_creacion']:
                    result['fecha_creacion'] = result['fecha_creacion'].isoformat()
                
                # Calcular marcador desde tabla Anotacion
                partido_id = result['partido_id']
                equipo_local_id = result['equipo_local_id']
                equipo_visitante_id = result['equipo_visitante_id']
                
                # Obtener puntos de cada equipo
                cursor.execute("""
                    SELECT 
                        ISNULL(SUM(CASE WHEN equipo_id = ? THEN puntos ELSE 0 END), 0) as puntos_local,
                        ISNULL(SUM(CASE WHEN equipo_id = ? THEN puntos ELSE 0 END), 0) as puntos_visitante
                    FROM dbo.Anotacion 
                    WHERE partido_id = ?
                """, (equipo_local_id, equipo_visitante_id, partido_id))
                
                marcador_row = cursor.fetchone()
                if marcador_row:
                    result['puntos_local'] = marcador_row[0]
                    result['puntos_visitante'] = marcador_row[1]
                else:
                    result['puntos_local'] = 0
                    result['puntos_visitante'] = 0
                
                results.append(result)
            
            return results
    
    def get_partido_by_id(self, partido_id: int) -> Optional[Dict[str, Any]]:
        """Obtiene un partido por ID"""
        query = """
        SELECT 
            partido_id as id,
            equipo_local_id,
            equipo_visitante_id,
            fecha_hora_inicio,
            estado,
            minutos_por_cuarto,
            cuartos_totales,
            faltas_por_equipo_limite,
            faltas_por_jugador_limite,
            sede,
            fecha_creacion
        FROM dbo.Partido
        WHERE partido_id = ?
        """
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (partido_id,))
            row = cursor.fetchone()
            
            if row:
                columns = [column[0] for column in cursor.description]
                partido = dict(zip(columns, row))
                # Convertir datetime a string para JSON
                if partido['fecha_hora_inicio']:
                    partido['fecha_hora_inicio'] = partido['fecha_hora_inicio'].isoformat()
                if partido['fecha_creacion']:
                    partido['fecha_creacion'] = partido['fecha_creacion'].isoformat()
                return partido
            
            return None
    
    def create_partido(self, partido_data: CreatePartidoRequest) -> int:
        """Crea un nuevo partido"""
        query = """
        INSERT INTO dbo.Partido (
            equipo_local_id,
            equipo_visitante_id,
            fecha_hora_inicio,
            estado,
            minutos_por_cuarto,
            cuartos_totales,
            faltas_por_equipo_limite,
            faltas_por_jugador_limite,
            sede
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (
                partido_data.equipo_local_id,
                partido_data.equipo_visitante_id,
                partido_data.fecha_hora_inicio,
                partido_data.estado,
                partido_data.minutos_por_cuarto,
                partido_data.cuartos_totales,
                partido_data.faltas_por_equipo_limite,
                partido_data.faltas_por_jugador_limite,
                partido_data.sede
            ))
            
            # Obtener el ID del partido creado
            cursor.execute("SELECT @@IDENTITY")
            partido_id = cursor.fetchone()[0]
            conn.commit()
            
            return int(partido_id)
    
    def update_partido(self, partido_id: int, partido_data) -> bool:
        """Actualiza un partido existente"""
        query = """
        UPDATE dbo.Partido SET
            equipo_local_id = ?,
            equipo_visitante_id = ?,
            fecha_hora_inicio = ?,
            estado = ?,
            minutos_por_cuarto = ?,
            cuartos_totales = ?,
            faltas_por_equipo_limite = ?,
            faltas_por_jugador_limite = ?,
            sede = ?
        WHERE partido_id = ?
        """
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (
                partido_data.equipo_local_id,
                partido_data.equipo_visitante_id,
                partido_data.fecha_hora_inicio,
                partido_data.estado,
                partido_data.minutos_por_cuarto,
                partido_data.cuartos_totales,
                partido_data.faltas_por_equipo_limite,
                partido_data.faltas_por_jugador_limite,
                partido_data.sede,
                partido_id
            ))
            
            rows_affected = cursor.rowcount
            conn.commit()
            
            return rows_affected > 0
    
    def delete_partido(self, partido_id: int) -> bool:
        """Elimina un partido"""
        query = "DELETE FROM dbo.Partido WHERE partido_id = ?"
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (partido_id,))
            
            rows_affected = cursor.rowcount
            conn.commit()
            
            return rows_affected > 0
    
    def update_partido_estado(self, partido_id: int, nuevo_estado: str) -> bool:
        """Actualiza solo el estado de un partido"""
        query = "UPDATE dbo.Partido SET estado = ? WHERE partido_id = ?"
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (nuevo_estado, partido_id))
            
            rows_affected = cursor.rowcount
            conn.commit()
            
            return rows_affected > 0
    
    # Métodos para Roster
    def get_roster_by_partido(self, partido_id: int) -> List[Dict[str, Any]]:
        """Obtiene el roster de un partido"""
        query = """
        SELECT 
            roster_id,
            partido_id,
            equipo_id,
            jugador_id,
            es_titular
        FROM dbo.RosterPartido
        WHERE partido_id = ?
        ORDER BY equipo_id, es_titular DESC, jugador_id
        """
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (partido_id,))
            columns = [column[0] for column in cursor.description]
            results = []
            
            for row in cursor.fetchall():
                roster_entry = dict(zip(columns, row))
                results.append(roster_entry)
            
            return results
    
    def clear_roster_partido(self, partido_id: int) -> bool:
        """Limpia el roster de un partido"""
        query = "DELETE FROM dbo.RosterPartido WHERE partido_id = ?"
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (partido_id,))
            conn.commit()
            return True
    
    def add_roster_entry(self, roster_data: CreateRosterEntry) -> int:
        """Agrega una entrada al roster"""
        query = """
        INSERT INTO dbo.RosterPartido (
            partido_id,
            equipo_id,
            jugador_id,
            es_titular
        ) VALUES (?, ?, ?, ?)
        """
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, (
                roster_data.partido_id,
                roster_data.equipo_id,
                roster_data.jugador_id,
                roster_data.es_titular
            ))
            
            # Obtener el ID del roster creado
            cursor.execute("SELECT @@IDENTITY")
            roster_id = cursor.fetchone()[0]
            conn.commit()
            
            return int(roster_id)
    
    def save_roster_complete(self, partido_id: int, roster_entries: List[Dict[str, Any]]) -> bool:
        """Guarda el roster completo de un partido"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Primero limpiar el roster existente
            cursor.execute("DELETE FROM dbo.RosterPartido WHERE partido_id = ?", (partido_id,))
            
            # Insertar las nuevas entradas
            for entry in roster_entries:
                cursor.execute("""
                    INSERT INTO dbo.RosterPartido (
                        partido_id,
                        equipo_id,
                        jugador_id,
                        es_titular
                    ) VALUES (?, ?, ?, ?)
                """, (
                    entry['partidoId'],
                    entry['equipoId'],
                    entry['jugadorId'],
                    entry['esTitular']
                ))
            
            conn.commit()
            return True
