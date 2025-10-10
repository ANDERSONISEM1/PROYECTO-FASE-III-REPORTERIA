export type Pos = 'PG'|'SG'|'SF'|'PF'|'C';

export interface EquipoLite {
  id: number;
  nombre: string;
}

export interface Jugador {
  id: number;
  equipoId: number;
  nombres: string;
  apellidos: string;
  dorsal?: number | null;
  posicion?: Pos | null;
  estatura_cm?: number | null;
  edad?: number | null;
  nacionalidad?: string | null;
  activo: boolean;
}

/* DTOs API */
export interface JugadorDto {
  id: number;
  equipoId: number;
  nombres: string;
  apellidos: string;
  dorsal?: number | null;
  posicion?: string | null;
  estaturaCm?: number | null;
  edad?: number | null;
  nacionalidad?: string | null;
  activo: boolean;
}

export interface CreateJugadorRequest {
  equipoId: number;
  nombres: string;
  apellidos: string;
  dorsal?: number | null;
  posicion?: string | null;
  estaturaCm?: number | null;
  edad?: number | null;
  nacionalidad?: string | null;
  activo: boolean;
}

export interface UpdateJugadorRequest extends CreateJugadorRequest {}
