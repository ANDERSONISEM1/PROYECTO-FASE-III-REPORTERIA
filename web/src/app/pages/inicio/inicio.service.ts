import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type Estado = 'programado'|'en_curso'|'finalizado'|'cancelado'|'suspendido';
export type Equipo = { id: number; nombre: string };

export type ProximoPartido = {
  id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  fecha_hora_inicio: string; // ISO
  sede: string;
  estado: Estado;
};

export type Kpis = {
  totalEquipos: number;
  totalJugadores: number;
  partidosPendientes: number;
};

@Injectable({ providedIn: 'root' })
export class InicioService {
  private readonly api = `${environment.apiBase}/api/inicio`;

  constructor(private http: HttpClient) {}

  getEquipos(): Observable<Equipo[]> {
    return this.http.get<any[]>(`${this.api}/equipos`).pipe(
      map(rows => (rows || []).map(r => ({ id: r.id, nombre: r.nombre } as Equipo)))
    );
  }

  getKpis(): Observable<Kpis> {
    return this.http.get<any>(`${this.api}/kpis`).pipe(
      map(r => ({
        totalEquipos: r.totalEquipos ?? 0,
        totalJugadores: r.totalJugadores ?? 0,
        partidosPendientes: r.partidosPendientes ?? 0
      } as Kpis))
    );
  }

  getProximo(): Observable<ProximoPartido | null> {
    return this.http.get<any>(`${this.api}/proximo`, { observe: 'response' }).pipe(
      map(res => {
        if (res.status === 204) return null;
        const r = res.body;
        if (!r) return null;
        return {
          id: r.id,
          equipo_local_id: r.equipoLocalId,
          equipo_visitante_id: r.equipoVisitanteId,
          fecha_hora_inicio: r.fechaHoraInicio ? new Date(r.fechaHoraInicio).toISOString() : '',
          sede: r.sede || '',
          estado: (r.estado || 'programado') as Estado
        } as ProximoPartido;
      })
    );
  }
}
