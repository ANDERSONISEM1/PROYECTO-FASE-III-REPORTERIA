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
  // .NET (5080) — KPIs y Dashboard
  private readonly apiDotnet = `${environment.apiDotNet}/api/inicio`;

  // JAVA (5081) — Equipos y Jugadores
  private readonly apiJavaEquipos = `${environment.apiJava}/api/equipos`;

  constructor(private http: HttpClient) {}

  // ===== EQUIPOS (Java :5081) =====
  getEquipos(): Observable<Equipo[]> {
    const url = `${this.apiJavaEquipos}?soloActivos=true`;
    return this.http.get<any[]>(url).pipe(
      map(rows => (rows || []).map(r => ({ id: r.id, nombre: r.nombre } as Equipo)))
    );
  }

  // ===== KPIs (.NET :5080) =====
  getKpis(): Observable<Kpis> {
    return this.http.get<any>(`${this.apiDotnet}/kpis`).pipe(
      map(r => ({
        totalEquipos: r.totalEquipos ?? 0,
        totalJugadores: r.totalJugadores ?? 0,
        partidosPendientes: r.partidosPendientes ?? 0
      } as Kpis))
    );
  }

  // ===== Próximo (.NET :5080) =====
  getProximo(): Observable<ProximoPartido | null> {
    return this.http.get<any>(`${this.apiDotnet}/proximo`, { observe: 'response' }).pipe(
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
