import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EquipoLite, Jugador, JugadorDto,
  CreateJugadorRequest, UpdateJugadorRequest
} from './jugadores.model';

@Injectable({ providedIn: 'root' })
export class JugadoresService {
  private readonly api = `${environment.apiBase}/api/admin/jugadores`;
  private readonly apiEquipos = `${environment.apiBase}/api/admin/equipos`;

  constructor(private http: HttpClient) {}

  getEquipos(): Observable<EquipoLite[]> {
    return this.http.get<any[]>(this.apiEquipos).pipe(
      map(rows => rows.map(r => ({ id: r.id, nombre: r.nombre }) as EquipoLite))
    );
  }

  private toJugador(dto: JugadorDto): Jugador {
    return {
      id: dto.id,
      equipoId: dto.equipoId,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dorsal: dto.dorsal ?? null,
      posicion: (dto.posicion as any) ?? null,
      estatura_cm: dto.estaturaCm ?? null,
      edad: dto.edad ?? null,
      nacionalidad: dto.nacionalidad ?? null,
      activo: dto.activo
    };
  }

  list(equipoId?: number): Observable<Jugador[]> {
    let params = new HttpParams();
    if (equipoId && equipoId > 0) params = params.set('equipoId', String(equipoId));
    return this.http.get<JugadorDto[]>(this.api, { params })
      .pipe(map(rows => rows.map(r => this.toJugador(r))));
  }

  create(j: Jugador): Observable<Jugador> {
    const body: CreateJugadorRequest = {
      equipoId: j.equipoId,
      nombres: j.nombres,
      apellidos: j.apellidos,
      dorsal: j.dorsal ?? null,
      posicion: j.posicion ?? null,
      estaturaCm: j.estatura_cm ?? null,
      edad: j.edad ?? null,
      nacionalidad: j.nacionalidad ?? null,
      activo: j.activo
    };
    return this.http.post<JugadorDto>(this.api, body).pipe(map(d => this.toJugador(d)));
  }

  update(id: number, j: Jugador): Observable<void> {
    const body: UpdateJugadorRequest = {
      equipoId: j.equipoId,
      nombres: j.nombres,
      apellidos: j.apellidos,
      dorsal: j.dorsal ?? null,
      posicion: j.posicion ?? null,
      estaturaCm: j.estatura_cm ?? null,
      edad: j.edad ?? null,
      nacionalidad: j.nacionalidad ?? null,
      activo: j.activo
    };
    return this.http.put<void>(`${this.api}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
