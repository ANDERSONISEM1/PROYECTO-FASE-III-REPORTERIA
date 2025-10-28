import { Injectable } from '@angular/core';

export type Column = { key: string; title: string };
export type ApiPage<T = any> = {
  columns: Column[]; 
  rows: T[]; 
  total: number; 
  page: number; 
  pageSize: number;
};

@Injectable({ providedIn: 'root' })
export class ReporteriaService {
  private base = '/api/report'; // pasa por el proxy hacia Laravel

  // 📊 MÉTODOS PARA OBTENER DATOS
  async getJugadores(params: { page?: number; pageSize?: number; equipo_id?: string; desde?: string; hasta?: string }) {
    const q = this.buildQueryParams(params);
    return fetch(`${this.base}/jugadores?${q}`).then(r => r.json()) as Promise<ApiPage>;
  }

  async getEquipos(params: { page?: number; pageSize?: number; desde?: string; hasta?: string }) {
    const q = this.buildQueryParams(params);
    return fetch(`${this.base}/equipos?${q}`).then(r => r.json()) as Promise<ApiPage>;
  }

  async getPartidos(params: { page?: number; pageSize?: number; desde?: string; hasta?: string }) {
    const q = this.buildQueryParams(params);
    return fetch(`${this.base}/partidos?${q}`).then(r => r.json()) as Promise<ApiPage>;
  }

  async getRoster(params: { page?: number; pageSize?: number; partido_id?: string; desde?: string; hasta?: string }) {
    const q = this.buildQueryParams(params);
    return fetch(`${this.base}/roster?${q}`).then(r => r.json()) as Promise<ApiPage>;
  }

  // 🔍 MÉTODOS DE BÚSQUEDA (LOOKUPS)
  async lookupEquipos() {
    return fetch(`${this.base}/lookup/equipos`).then(r => r.json()) as Promise<{id: string, nombre: string}[]>;
  }

  async lookupPartidos() {
    return fetch(`${this.base}/lookup/partidos`).then(r => r.json()) as Promise<any[]>;
  }

  // 📄 MÉTODOS PARA GENERAR PDF
  getJugadoresPdfUrl(params: {
    equipo_id?: string;
    desde?: string;
    hasta?: string;
    all?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const q = this.buildPdfQueryParams(params);
    return `${this.base}/jugadores/pdf?${q}`;
  }

  getEquiposPdfUrl(params: {
    desde?: string;
    hasta?: string;
    all?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const q = this.buildPdfQueryParams(params);
    return `${this.base}/equipos/pdf?${q}`;
  }

  getPartidosPdfUrl(params: {
    desde?: string;
    hasta?: string;
    all?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const q = this.buildPdfQueryParams(params);
    return `${this.base}/partidos/pdf?${q}`;
  }

  getRosterPdfUrl(params: {
    partido_id?: string;
    desde?: string;
    hasta?: string;
    all?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const q = this.buildPdfQueryParams(params);
    return `${this.base}/roster/pdf?${q}`;
  }

  // 🛠️ MÉTODOS PRIVADOS AUXILIARES
  private buildQueryParams(params: any): string {
    const q = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        q.set(key, String(params[key]));
      }
    });
    return q.toString();
  }

  private buildPdfQueryParams(params: any): string {
    const q = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        if (key === 'all' && params[key]) {
          q.set('all', '1');
        } else if (key !== 'all' || !params.all) {
          // Solo incluir paginación si no es "all"
          if (!(params.all && (key === 'page' || key === 'pageSize'))) {
            q.set(key, String(params[key]));
          }
        }
      }
    });
    return q.toString();
  }
}