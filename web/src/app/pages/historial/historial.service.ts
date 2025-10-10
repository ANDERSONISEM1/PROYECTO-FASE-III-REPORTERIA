import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type Estado = 'programado'|'en_curso'|'finalizado'|'cancelado'|'suspendido';
type Team = { id: number; nombre: string };

export type Partido = {
  id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  fecha_hora_inicio: string; // ISO
  sede: string;
  estado: Estado;
  puntos_local: number;
  puntos_visitante: number;
};

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly api = `${environment.apiBase}`;

  constructor(private http: HttpClient) {}

  getEquipos(): Observable<Team[]> {
    return this.http.get<any[]>(`${this.api}/api/historial/equipos`).pipe(
      map(rows => (rows || []).map(r => ({ id: r.id, nombre: r.nombre } as Team)))
    );
  }

  getPartidos(equipoId?: number): Observable<Partido[]> {
    const url = equipoId && equipoId > 0
      ? `${this.api}/api/historial/partidos?equipoId=${equipoId}`
      : `${this.api}/api/historial/partidos`;

    return this.http.get<any[]>(url).pipe(
      map(rows => (rows || []).map(r => ({
        id: r.id,
        equipo_local_id: r.equipoLocalId,
        equipo_visitante_id: r.equipoVisitanteId,
        fecha_hora_inicio: r.fechaHoraInicio ? new Date(r.fechaHoraInicio).toISOString() : '',
        sede: r.sede || '',
        estado: r.estado as Estado,
        puntos_local: r.puntosLocal ?? 0,
        puntos_visitante: r.puntosVisitante ?? 0,
      } as Partido)))
    );
  }
}
