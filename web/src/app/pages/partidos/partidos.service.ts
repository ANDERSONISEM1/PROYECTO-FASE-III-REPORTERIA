import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Match, PartidoDto, CreatePartidoRequest, SaveRosterRequest, RosterEntry } from './partidos.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PartidosService {
  private readonly api = `${environment.apiBase}/api/admin/partidos`;
  private readonly apiEquipos = `${environment.apiBase}/api/admin/equipos`;
  private readonly apiJugadores = `${environment.apiBase}/api/admin/jugadores`;

  constructor(private http: HttpClient) {}

  private toMatch(dto: PartidoDto): Match {
    const toLocalInput = (iso?: string|null) => {
      if (!iso) return '';
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return {
      id: dto.id,
      equipo_local_id: dto.equipoLocalId,
      equipo_visitante_id: dto.equipoVisitanteId,
      fecha_hora_inicio: toLocalInput(dto.fechaHoraInicio),
      sede: dto.sede ?? '',
      estado: dto.estado,
      minutos_por_cuarto: dto.minutosPorCuarto,
      cuartos_totales: dto.cuartosTotales,
      faltas_por_equipo_limite: dto.faltasPorEquipoLimite,
      faltas_por_jugador_limite: dto.faltasPorJugadorLimite
    };
  }

  list(): Observable<Match[]> {
    return this.http.get<PartidoDto[]>(this.api).pipe(map(rows => rows.map(r => this.toMatch(r))));
  }

  create(m: Match): Observable<Match> {
    const toUtcIso = (local: string) => new Date(local).toISOString();
    const body: CreatePartidoRequest = {
      equipoLocalId: m.equipo_local_id,
      equipoVisitanteId: m.equipo_visitante_id,
      fechaHoraInicio: m.fecha_hora_inicio ? toUtcIso(m.fecha_hora_inicio) : null,
      estado: m.estado,
      minutosPorCuarto: 10,
      cuartosTotales: 4,
      faltasPorEquipoLimite: m.faltas_por_equipo_limite || 255,
      faltasPorJugadorLimite: m.faltas_por_jugador_limite || 5,
      sede: m.sede || null
    };
    return this.http.post<PartidoDto>(this.api, body).pipe(map(d => this.toMatch(d)));
  }

  update(id: number, m: Match): Observable<void> {
    const body: CreatePartidoRequest = {
      equipoLocalId: m.equipo_local_id,
      equipoVisitanteId: m.equipo_visitante_id,
      fechaHoraInicio: m.fecha_hora_inicio ? new Date(m.fecha_hora_inicio).toISOString() : null,
      estado: m.estado,
      minutosPorCuarto: 10,
      cuartosTotales: 4,
      faltasPorEquipoLimite: m.faltas_por_equipo_limite || 255,
      faltasPorJugadorLimite: m.faltas_por_jugador_limite || 5,
      sede: m.sede || null
    };
    return this.http.put<void>(`${this.api}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getRoster(partidoId: number): Observable<RosterEntry[]> {
    return this.http.get<any[]>(`${this.api}/${partidoId}/roster`).pipe(
      map(rows => rows.map(r => ({
        partido_id: r.partidoId,
        equipo_id: r.equipoId,
        jugador_id: r.jugadorId,
        es_titular: !!r.esTitular
      }) as RosterEntry))
    );
  }

  saveRoster(partidoId: number, items: RosterEntry[]): Observable<void> {
    const body: SaveRosterRequest = {
      partidoId,
      items: items.map(r => ({
        partidoId: r.partido_id,
        equipoId: r.equipo_id,
        jugadorId: r.jugador_id,
        esTitular: r.es_titular
      }))
    };
    return this.http.put<void>(`${this.api}/${partidoId}/roster`, body);
  }

  getEquipos(): Observable<any[]> { return this.http.get<any[]>(this.apiEquipos); }
  getJugadores(): Observable<any[]> { return this.http.get<any[]>(this.apiJugadores); }
}
