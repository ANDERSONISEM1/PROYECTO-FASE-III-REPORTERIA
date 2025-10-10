import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Team, TeamUpdate, EquipoDto, CreateEquipoRequest, UpdateEquipoRequest } from './equipos.model';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private readonly api = `${environment.apiBase}/api/admin/equipos`;

  constructor(private http: HttpClient) {}

  todayStr(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private toTeam(dto: EquipoDto): Team {
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
    return this.http.get<EquipoDto[]>(this.api).pipe(
      map(rows => rows.map(r => this.toTeam(r)))
    );
  }

  create(item: Team): Observable<Team> {
    const body: CreateEquipoRequest = {
      nombre: item.nombre,
      ciudad: item.ciudad,
      abreviatura: item.abreviatura,
      activo: item.activo,
      fechaCreacion: new Date(item.fecha_creacion).toISOString(),
      logoBase64: item.logo
    };
    return this.http.post<EquipoDto>(this.api, body).pipe(
      map(dto => this.toTeam(dto))
    );
  }

  update(id: number, changes: TeamUpdate): Observable<void> {
    const body: UpdateEquipoRequest = {
      nombre: (changes.nombre ?? '').trim(),
      ciudad: (changes.ciudad ?? '').trim(),
      abreviatura: (changes.abreviatura ?? '').trim(),
      activo: changes.activo ?? true,
      // null = no tocar; "" = borrar; valor = reemplazar
      logoBase64: changes.logo === undefined ? null : (changes.logo || '')
    };
    return this.http.put<void>(`${this.api}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  // ===== NUEVO: info para confirmación =====
  getDeleteInfo(id: number): Observable<{
    canDelete: boolean;
    totalJugadores: number;
    jugadores: Array<{id:number; nombres:string; apellidos:string; dorsal?: number}>;
    partidos: { total:number; programado:number; enCurso:number; finalizado:number; cancelado:number; suspendido:number };
  }> {
    return this.http.get<any>(`${this.api}/${id}/delete-info`).pipe(
      map(r => ({
        canDelete: !!r.canDelete,
        totalJugadores: r.totalJugadores ?? 0,
        jugadores: (r.jugadores || []).map((j:any)=>({ id:j.id, nombres:j.nombres, apellidos:j.apellidos, dorsal:j.dorsal ?? undefined })),
        partidos: {
          total: r.partidos?.total ?? 0,
          programado: r.partidos?.programado ?? 0,
          enCurso: r.partidos?.enCurso ?? 0,
          finalizado: r.partidos?.finalizado ?? 0,
          cancelado: r.partidos?.cancelado ?? 0,
          suspendido: r.partidos?.suspendido ?? 0
        }
      }))
    );
  }
}
