import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenStorage } from '../../Auth/token-storage.service';
import { Router } from '@angular/router';

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
  // PYTHON (5082) — KPIs y Dashboard (cambio de .NET a Python)
  private readonly apiPython = `${environment.apiPython}/api/admin/inicio`;

  // JAVA (5081) — Equipos y Jugadores
  private readonly apiJavaEquipos = `${environment.apiJava}/api/equipos`;

  constructor(
    private http: HttpClient, 
    private tokenStorage: TokenStorage,
    private router: Router
  ) {}

  // Helper para headers con autorización
  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenStorage.accessToken;
    if (token) {
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    return new HttpHeaders();
  }

  // ===== EQUIPOS (Java :5081) =====
  getEquipos(): Observable<Equipo[]> {
    const url = `${this.apiJavaEquipos}?soloActivos=true`;
    return this.http.get<any[]>(url).pipe(
      map(rows => (rows || []).map(r => ({ id: r.id, nombre: r.nombre } as Equipo)))
    );
  }

  // ===== KPIs (Python :5082) =====
  getKpis(): Observable<Kpis> {
    if (!this.tokenStorage.isLogged()) {
      this.router.navigate(['/login']);
      return of({ totalEquipos: 0, totalJugadores: 0, partidosPendientes: 0 });
    }

    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiPython}/kpis`, { headers }).pipe(
      map(r => ({
        totalEquipos: r.totalEquipos ?? 0,
        totalJugadores: r.totalJugadores ?? 0,
        partidosPendientes: r.partidosPendientes ?? 0
      } as Kpis)),
      catchError(error => {
        if (error.status === 401) {
          this.tokenStorage.clear();
          this.router.navigate(['/login']);
        }
        return of({ totalEquipos: 0, totalJugadores: 0, partidosPendientes: 0 });
      })
    );
  }

  // ===== Próximo (Python :5082) =====
  getProximo(): Observable<ProximoPartido | null> {
    if (!this.tokenStorage.isLogged()) {
      this.router.navigate(['/login']);
      return of(null);
    }

    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiPython}/proximo`, { headers, observe: 'response' }).pipe(
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
      }),
      catchError(error => {
        if (error.status === 401) {
          this.tokenStorage.clear();
          this.router.navigate(['/login']);
        }
        return of(null);
      })
    );
  }
}
