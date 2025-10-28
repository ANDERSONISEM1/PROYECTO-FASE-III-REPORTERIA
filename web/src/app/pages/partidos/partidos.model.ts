export type EstadoPartido = 'programado'|'en_curso'|'finalizado'|'cancelado'|'suspendido';

export interface Team { id: number; nombre: string; }
export interface PlayerLite { id: number; equipoId: number; nombre: string; dorsal?: number; }

export interface Match {
  id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  fecha_hora_inicio: string; // ISO local for input[type=datetime-local]
  sede: string;
  estado: EstadoPartido;
  minutos_por_cuarto: number;
  cuartos_totales: number;
  faltas_por_equipo_limite: number;
  faltas_por_jugador_limite: number;
}

export interface RosterEntry {
  partido_id: number;
  equipo_id: number;
  jugador_id: number;
  es_titular: boolean;
}

/* ===== DTOs API ===== */
export interface PartidoDto {
  id: number;
  equipoLocalId: number;
  equipoVisitanteId: number;
  fechaHoraInicio?: string | null;
  estado: EstadoPartido;
  minutosPorCuarto: number;
  cuartosTotales: number;
  faltasPorEquipoLimite: number;
  faltasPorJugadorLimite: number;
  sede?: string | null;
  fechaCreacion: string;
}

export interface CreatePartidoRequest {
  equipoLocalId: number;
  equipoVisitanteId: number;
  fechaHoraInicio?: string | null; // ISO UTC
  estado: EstadoPartido;
  minutosPorCuarto: number;
  cuartosTotales: number;
  faltasPorEquipoLimite: number;
  faltasPorJugadorLimite: number;
  sede?: string | null;
}

export interface SaveRosterRequest {
  partidoId: number;
  items: Array<{ partidoId: number; equipoId: number; jugadorId: number; esTitular: boolean; }>;
}
