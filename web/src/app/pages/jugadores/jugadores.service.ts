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
  private readonly api = `${environment.apiJava}/api/jugadores`;
  private readonly apiEquipos = `${environment.apiJava}/api/equipos`;

  constructor(private http: HttpClient) {}

  getEquipos(): Observable<EquipoLite[]> {
    return this.http.get<any[]>(this.apiEquipos).pipe(
      map(rows => rows.map(r => ({ id: r.id, nombre: r.nombre }) as EquipoLite))
    );
  }

  private toJugador(dto: any): Jugador {
    return {
      id: dto.id,
      equipoId: dto.equipoId,
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      dorsal: dto.dorsal ?? null,
      posicion: dto.posicion ?? null,
      estatura_cm: dto.estaturaCm ?? null,
      edad: dto.edad ?? null,
      nacionalidad: dto.nacionalidad ?? null,
      activo: dto.activo
    };
  }

  list(equipoId?: number): Observable<Jugador[]> {
    let params = new HttpParams();
    if (equipoId && equipoId > 0) params = params.set('equipoId', String(equipoId));
    return this.http.get<any[]>(this.api, { params })
      .pipe(map(rows => rows.map(r => this.toJugador(r))));
  }

  create(j: Jugador): Observable<Jugador> {
    const body = {
      equipoId: j.equipoId,
      nombres: j.nombres?.trim() || '',
      apellidos: j.apellidos?.trim() || '',
      dorsal: j.dorsal || null,
      posicion: j.posicion || null,
      estaturaCm: j.estatura_cm || null,
      edad: j.edad || null,
      nacionalidad: j.nacionalidad || null,
      activo: j.activo !== false
    };
    
    // Validaciones básicas antes de enviar (compatibles con Java API)
    if (!body.nombres || body.nombres.length < 2) {
      throw new Error('Los nombres son obligatorios y deben tener al menos 2 caracteres');
    }
    if (!body.apellidos || body.apellidos.length < 2) {
      throw new Error('Los apellidos son obligatorios y deben tener al menos 2 caracteres');
    }
    if (!body.equipoId || body.equipoId < 1) {
      throw new Error('Debe seleccionar un equipo válido');
    }
    if (body.dorsal !== null && (body.dorsal < 0 || body.dorsal > 99)) {
      throw new Error('El dorsal debe estar entre 0 y 99');
    }
    if (body.estaturaCm !== null && body.estaturaCm !== undefined && (body.estaturaCm < 50 || body.estaturaCm > 250)) {
      throw new Error('La estatura debe estar entre 50 y 250 cm');
    }
    if (body.edad !== null && body.edad !== undefined && (body.edad < 15 || body.edad > 50)) {
      throw new Error('La edad debe estar entre 15 y 50 años');
    }
    
    return this.http.post<any>(this.api, body).pipe(map(d => this.toJugador(d)));
  }

  update(id: number, j: Jugador): Observable<void> {
    const body = {
      equipoId: j.equipoId,
      nombres: j.nombres?.trim() || '',
      apellidos: j.apellidos?.trim() || '',
      dorsal: j.dorsal || null,
      posicion: j.posicion || null,
      estaturaCm: j.estatura_cm || null,
      edad: j.edad || null,
      nacionalidad: j.nacionalidad || null,
      activo: j.activo !== false
    };
    
    // Validaciones básicas antes de enviar (compatibles con Java API)
    if (!body.nombres || body.nombres.length < 2) {
      throw new Error('Los nombres son obligatorios y deben tener al menos 2 caracteres');
    }
    if (!body.apellidos || body.apellidos.length < 2) {
      throw new Error('Los apellidos son obligatorios y deben tener al menos 2 caracteres');
    }
    if (!body.equipoId || body.equipoId < 1) {
      throw new Error('Debe seleccionar un equipo válido');
    }
    if (body.dorsal !== null && (body.dorsal < 0 || body.dorsal > 99)) {
      throw new Error('El dorsal debe estar entre 0 y 99');
    }
    if (body.estaturaCm !== null && body.estaturaCm !== undefined && (body.estaturaCm < 50 || body.estaturaCm > 250)) {
      throw new Error('La estatura debe estar entre 50 y 250 cm');
    }
    if (body.edad !== null && body.edad !== undefined && (body.edad < 15 || body.edad > 50)) {
      throw new Error('La edad debe estar entre 15 y 50 años');
    }
    
    return this.http.put<void>(`${this.api}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
