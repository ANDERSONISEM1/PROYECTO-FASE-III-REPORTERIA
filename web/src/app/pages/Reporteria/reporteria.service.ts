import { Injectable } from '@angular/core';

export type Column = { key: string; title: string };
export type ApiPage<T=any> = {
  columns: Column[]; rows: T[]; total: number; page: number; pageSize: number;
};

@Injectable({ providedIn: 'root' })
export class ReporteriaService {
  private base = '/api/report'; // pasa por el proxy hacia Laravel

  async getJugadores(params: { page?: number; pageSize?: number; equipo_id?: string }) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.equipo_id) q.set('equipo_id', params.equipo_id);
    return fetch(`${this.base}/jugadores?${q.toString()}`).then(r => r.json()) as Promise<ApiPage>;
  }

  async getEquipos(params: { page?: number; pageSize?: number; desde?: string; hasta?: string }) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.desde) q.set('desde', params.desde);
    if (params.hasta) q.set('hasta', params.hasta);
    return fetch(`${this.base}/equipos?${q.toString()}`).then(r => r.json()) as Promise<ApiPage>;
  }

  async getPartidos(params: { page?: number; pageSize?: number; desde?: string; hasta?: string }) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.desde) q.set('desde', params.desde);
    if (params.hasta) q.set('hasta', params.hasta);
    return fetch(`${this.base}/partidos?${q.toString()}`).then(r => r.json()) as Promise<ApiPage>;
  }

  async getRoster(params: { page?: number; pageSize?: number; partido_id?: string }) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.partido_id) q.set('partido_id', params.partido_id);
    return fetch(`${this.base}/roster?${q.toString()}`).then(r => r.json()) as Promise<ApiPage>;
  }

  async lookupEquipos()  {
    return fetch(`${this.base}/lookup/equipos`).then(r => r.json()) as Promise<{id:string,nombre:string}[]>;
  }
  async lookupPartidos() {
    return fetch(`${this.base}/lookup/partidos`).then(r => r.json()) as Promise<any[]>;
  }

  
getJugadoresPdfUrl(params: {
  equipo_id?: string;
  desde?: string;
  hasta?: string;
  all?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const q = new URLSearchParams();
  if (params.equipo_id) q.set('equipo_id', params.equipo_id);
  if (params.desde) q.set('desde', params.desde);
  if (params.hasta) q.set('hasta', params.hasta);
  if (params.all) q.set('all', '1'); // all=1 => sin paginar
  if (!params.all) {
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
  }
  return `/api/report/jugadores/pdf?${q.toString()}`;
}
// reporteria.service.ts

getEquiposPdfUrl(params: {
  desde?: string;
  hasta?: string;
  all?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const q = new URLSearchParams();
  if (params.desde) q.set('desde', params.desde);
  if (params.hasta) q.set('hasta', params.hasta);
  if (params.all) q.set('all', '1'); // all=1 => sin paginar
  if (!params.all) {
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
  }
  return `/api/report/equipos/pdf?${q.toString()}`;
}


}
