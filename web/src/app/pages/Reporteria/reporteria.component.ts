import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReporteriaService, Column, ApiPage } from './reporteria.service';

type TabKey = 'jugadores' | 'equipos' | 'partidos' | 'roster';

@Component({
  standalone: true,
  selector: 'app-reporteria',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="reporteria-page">
    <div class="main">
      <h1>📑 Generar Reportes</h1>

      <div class="tabs">
        <button class="tab" [class.active]="state.tab==='jugadores'" (click)="changeTab('jugadores')">Jugadores</button>
        <button class="tab" [class.active]="state.tab==='equipos'"   (click)="changeTab('equipos')">Equipos</button>
        <button class="tab" [class.active]="state.tab==='partidos'"  (click)="changeTab('partidos')">Partidos</button>
        <button class="tab" [class.active]="state.tab==='roster'"    (click)="changeTab('roster')">Roster</button>
      </div>

      <div class="filter-bar">
        <!-- Fecha Inicio -->
        <div class="field">
          <span class="label">Fecha Inicio</span>
          <input type="date"
                 [(ngModel)]="state.desde"
                 (ngModelChange)="fetchAndRender()"
                 [disabled]="todo"/>
        </div>

        <!-- Fecha Fin -->
        <div class="field">
          <span class="label">Fecha Fin</span>
          <input type="date"
                 [(ngModel)]="state.hasta"
                 (ngModelChange)="fetchAndRender()"
                 [disabled]="todo"/>
        </div>

        <!-- TODO COMPLETO: INDEPENDIENTE POR PESTAÑA -->
        <div class="field">
          <span class="label">Todo completo</span>
          <div class="switch-wrap">
            <span class="switch-text">Todo completo</span>
            <label class="switch" aria-label="Todo completo">
              <input type="checkbox" [(ngModel)]="todo" />
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Filtro por equipo (solo Jugadores) -->
        <div class="field" *ngIf="state.tab==='jugadores'">
          <span class="label">Filtrar por Equipo</span>
          <select [(ngModel)]="state.equipoId" (change)="fetchAndRender()">
            <option [ngValue]="''">— Selecciona equipo —</option>
            <option *ngFor="let e of equipos" [ngValue]="e.id">{{ e.nombre }}</option>
          </select>
        </div>

        <!-- Filtro por partido (SOLO ROSTER) -->
        <div class="field" *ngIf="state.tab==='roster'">
          <span class="label">Filtrar Roster por partidos</span>
          <select [(ngModel)]="state.partidoId" (change)="fetchAndRender()">
            <option [ngValue]="''">— Selecciona partido —</option>
            <option *ngFor="let p of partidos" [ngValue]="p.id">
              {{ p.id }} • {{ p.local }} vs {{ p.visit }} ({{ p.fecha }} {{ p.hora }})
            </option>
          </select>
        </div>

        <!-- Acciones -->
        <div class="actions">
          <button class="btn btn-pdf" type="button" (click)="exportPDF()">📄 Generar PDF</button>
        </div>
      </div>

      <div class="report-preview">
        <h3>Vista Previa</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th *ngFor="let c of state.columns">{{ c.title }}</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of state.rows">
                <td *ngFor="let c of state.columns">{{ r[c.key] ?? '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pager" *ngIf="state.total > 0">
          <div class="left">
            <button (click)="prevPage()">« Anterior</button>
            <button (click)="nextPage()">Siguiente »</button>
            <span class="info">Página {{ state.page }} de {{ maxPage }}</span>
          </div>
          <div class="right">
            <span class="info">Filas por página</span>
            <select [(ngModel)]="state.pageSize" (change)="onPageSizeChange()">
              <option [ngValue]="10">10</option>
              <option [ngValue]="20">20</option>
              <option [ngValue]="50">50</option>
              <option [ngValue]="100">100</option>
            </select>
            <span class="info">Total: {{ state.total }}</span>
          </div>
        </div>
      </div>

      <div class="footer">© 2025 Marcador Basket – Sistema de Reportería</div>
    </div>
  </div>
  `
})
export class ReporteriaComponent implements OnInit {
  constructor(private api: ReporteriaService) {}

  state = {
    tab: 'jugadores' as TabKey,
    desde: '', hasta: '',
    // mapa por pestaña: cada tab recuerda su propio "todo"
    todoByTab: {
      jugadores: true,
      equipos:   true,
      partidos:  true,
      roster:    true
    } as Record<TabKey, boolean>,
    page: 1, pageSize: 10, total: 0,
    columns: [] as Column[], rows: [] as any[],
    equipoId: '', partidoId: ''
  };

  equipos: {id:string,nombre:string}[] = [];
  partidos: any[] = [];

  // acceso cómodo al “todo” de la pestaña actual
  get todo(): boolean {
    return this.state.todoByTab[this.state.tab];
  }
  set todo(v: boolean) {
    this.state.todoByTab[this.state.tab] = v;
    // si activás “todo”, no toco fechas globales (independencia del toggle)
    this.fetchAndRender();
  }

  get maxPage() { return Math.max(1, Math.ceil(this.state.total / this.state.pageSize)); }

  async ngOnInit() {
    await this.loadLookups();
    await this.fetchAndRender();
  }

  async loadLookups() {
    [this.equipos, this.partidos] = await Promise.all([
      this.api.lookupEquipos(),
      this.api.lookupPartidos()
    ]);
  }

  async changeTab(tab: TabKey) {
    if (this.state.tab === tab) return;
    this.state.tab = tab;
    this.state.page = 1;

    // Limpiar filtros específicos
    if (tab !== 'jugadores') this.state.equipoId = '';
    if (tab !== 'roster') this.state.partidoId = '';   // 👈 ahora SOLO roster usa partidoId

    await this.fetchAndRender();
  }

  prevPage() { if (this.state.page > 1) { this.state.page--; this.fetchAndRender(); } }
  nextPage() { if (this.state.page < this.maxPage) { this.state.page++; this.fetchAndRender(); } }
  onPageSizeChange() { this.state.page = 1; this.fetchAndRender(); }

  async fetchAndRender() {
    let data: ApiPage;
    const base = { page: this.state.page, pageSize: this.state.pageSize };
    const disableDates = this.todo; // independiente por tab

    if (this.state.tab === 'jugadores') {
      data = await this.api.getJugadores({ ...base, equipo_id: this.state.equipoId || undefined });
    } else if (this.state.tab === 'equipos') {
      data = await this.api.getEquipos({
        ...base,
        desde: disableDates ? undefined : (this.state.desde || undefined),
        hasta: disableDates ? undefined : (this.state.hasta || undefined)
      });
    } else if (this.state.tab === 'partidos') {
      data = await this.api.getPartidos({
        ...base,
        desde: disableDates ? undefined : (this.state.desde || undefined),
        hasta: disableDates ? undefined : (this.state.hasta || undefined)
      });
    } else {
      // roster
      data = await this.api.getRoster({ ...base, partido_id: this.state.partidoId || undefined });
    }

    this.state.columns = data.columns;
    this.state.rows    = data.rows;
    this.state.total   = data.total;
  }

  exportPDF() {
    if (this.state.tab === 'jugadores') {
      const disableDates = this.todo; // “Todo completo” de la pestaña
      const url = this.api.getJugadoresPdfUrl({
        equipo_id: this.state.equipoId || undefined,
        desde: disableDates ? undefined : (this.state.desde || undefined),
        hasta: disableDates ? undefined : (this.state.hasta || undefined),
        all: this.todo, // si está marcado: PDF sin paginar
        page: this.state.page,
        pageSize: this.state.pageSize,
      });
      window.open(url, '_blank');
      return;
    }

    if (this.state.tab === 'equipos') {
      const disableDates = this.todo;
      const url = this.api.getEquiposPdfUrl({
        desde: disableDates ? undefined : (this.state.desde || undefined),
        hasta: disableDates ? undefined : (this.state.hasta || undefined),
        all: this.todo,
        page: this.state.page,
        pageSize: this.state.pageSize,
      });
      window.open(url, '_blank');
      return;
    }

    // Las otras pestañas quedan igual por ahora
    const scope = this.todo
      ? 'Todo completo'
      : (this.state.desde && this.state.hasta)
          ? `Del ${this.state.desde} al ${this.state.hasta}`
          : `Página ${this.state.page} / ${this.state.total}`;
    alert(`PDF: ${scope} (implementación pendiente para esta pestaña)`);
  }
}
