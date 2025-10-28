import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Team, TeamUpdate, EquipoDto, CreateEquipoRequest, UpdateEquipoRequest } from './equipos.model';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private readonly api = `${environment.apiJava}/api/equipos`;

  constructor(private http: HttpClient) {}

  todayStr(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private toTeam(dto: any): Team {
    const fecha = dto.fechaCreacion
      ? new Date(dto.fechaCreacion).toISOString().slice(0,10)
      : this.todayStr();
    const logoUrl = `${this.api}/${dto.id}/logo`;
    return {
      id: dto.id,
      nombre: dto.nombre,
      ciudad: dto.ciudad ?? '',
      abreviatura: dto.abreviatura ?? '',
      activo: dto.activo,
      fecha_creacion: fecha,
      logo: logoUrl
    };
  }

  getAll(): Observable<Team[]> {
    return this.http.get<any[]>(this.api).pipe(
      map(rows => rows.map(r => this.toTeam(r)))
    );
  }

  create(item: Team): Observable<Team> {
    const body = {
      nombre: item.nombre,
      ciudad: item.ciudad,
      abreviatura: item.abreviatura,
      activo: item.activo
    };
    return this.http.post<any>(this.api, body).pipe(
      map(dto => this.toTeam(dto))
    );
  }

  update(id: number, changes: TeamUpdate): Observable<void> {
    const body = {
      nombre: (changes.nombre ?? '').trim(),
      ciudad: (changes.ciudad ?? '').trim(),
      abreviatura: (changes.abreviatura ?? '').trim(),
      activo: changes.activo ?? true
    };
    return this.http.put<void>(`${this.api}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  // Método simplificado sin endpoint delete-info
  getDeleteInfo(id: number): Observable<{
    canDelete: boolean;
    totalJugadores: number;
    jugadores: Array<{id:number; nombres:string; apellidos:string; dorsal?: number}>;
    partidos: { total:number; programado:number; enCurso:number; finalizado:number; cancelado:number; suspendido:number };
  }> {
    // Como no existe el endpoint delete-info, simulamos la respuesta
    // El usuario verá una confirmación simple
    return new Observable(observer => {
      observer.next({
        canDelete: true, // Asumimos que se puede eliminar
        totalJugadores: 0, // No tenemos info específica
        jugadores: [],
        partidos: {
          total: 0,
          programado: 0,
          enCurso: 0,
          finalizado: 0,
          cancelado: 0,
          suspendido: 0
        }
      });
      observer.complete();
    });
  }
}
