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
        <!-- Fecha Inicio (INDEPENDIENTE POR PESTAÑA) -->
        <div class="field">
          <span class="label">Fecha Inicio</span>
          <input type="date"
                 [value]="currentDates.desde"
                 (input)="onDateChange('desde', $event)"
                 [disabled]="todo"/>
        </div>

        <!-- Fecha Fin (INDEPENDIENTE POR PESTAÑA) -->
        <div class="field">
          <span class="label">Fecha Fin</span>
          <input type="date"
                 [value]="currentDates.hasta"
                 (input)="onDateChange('hasta', $event)"
                 [disabled]="todo"/>
        </div>

        <!-- TODO COMPLETO: INDEPENDIENTE POR PESTAÑA -->
        <div class="field">
          <span class="label">Todo completo</span>
          <div class="switch-wrap">
            <span class="switch-text">Todo completo</span>
            <label class="switch" aria-label="Todo completo">
              <input type="checkbox" [(ngModel)]="todo" (change)="fetchAndRender()"/>
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <!-- Filtro por equipo (SOLO Jugadores) -->
        <div class="field" *ngIf="state.tab==='jugadores'">
          <span class="label">Filtrar por Equipo</span>
          <select [(ngModel)]="state.equipoId" (change)="fetchAndRender()">
            <option [ngValue]="''">— Selecciona equipo —</option>
            <option *ngFor="let e of equipos" [ngValue]="e.id">{{ e.nombre }}</option>
          </select>
        </div>

        <!-- Filtro por partido (SOLO Roster) -->
        <div class="field" *ngIf="state.tab==='roster'">
          <span class="label">Filtrar por Partido</span>
          <select [(ngModel)]="state.partidoId" (change)="fetchAndRender()">
            <option [ngValue]="''">— Selecciona partido —</option>
            <option *ngFor="let p of partidos" [ngValue]="p.id">
              {{ p.local }} vs {{ p.visit }} ({{ p.fecha }})
            </option>
          </select>
        </div>

        <!-- Acciones -->
        <div class="actions">
          <button class="btn btn-pdf" type="button" (click)="exportPDF()">📄 Generar PDF</button>
        </div>
      </div>

      <div class="report-preview">
        <h3>Vista Previa - {{ getTabTitle() }}</h3>
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
            <button (click)="prevPage()" [disabled]="state.page <= 1">« Anterior</button>
            <button (click)="nextPage()" [disabled]="state.page >= maxPage">Siguiente »</button>
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
    page: 1, 
    pageSize: 10, 
    total: 0,
    columns: [] as Column[], 
    rows: [] as any[],
    equipoId: '', 
    partidoId: ''
  };

  // ✅ FECHAS INDEPENDIENTES POR PESTAÑA
  datesByTab: Record<TabKey, {desde: string, hasta: string}> = {
    jugadores: { desde: '', hasta: '' },
    equipos:   { desde: '', hasta: '' },
    partidos:  { desde: '', hasta: '' },
    roster:    { desde: '', hasta: '' }
  };

  // ✅ TODO INDEPENDIENTE POR PESTAÑA
  todoByTab: Record<TabKey, boolean> = {
    jugadores: true,
    equipos:   true,
    partidos:  true,
    roster:    true
  };

  equipos: {id: string, nombre: string}[] = [];
  partidos: any[] = [];

  // Acceso a las fechas de la pestaña actual
  get currentDates() {
    return this.datesByTab[this.state.tab];
  }

  // Acceso al "todo" de la pestaña actual
  get todo(): boolean {
    return this.todoByTab[this.state.tab];
  }
  set todo(v: boolean) {
    this.todoByTab[this.state.tab] = v;
  }

  get maxPage() { 
    return Math.max(1, Math.ceil(this.state.total / this.state.pageSize)); 
  }

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

  // ✅ MANEJO INDEPENDIENTE DE FECHAS
  onDateChange(field: 'desde' | 'hasta', event: any) {
    this.currentDates[field] = event.target.value;
    this.fetchAndRender();
  }

  getTabTitle(): string {
    const titles = {
      jugadores: 'Jugadores',
      equipos: 'Equipos', 
      partidos: 'Partidos',
      roster: 'Roster por Partido'
    };
    return titles[this.state.tab];
  }

  async changeTab(tab: TabKey) {
    if (this.state.tab === tab) return;
    
    this.state.tab = tab;
    this.state.page = 1;
    this.state.equipoId = '';
    this.state.partidoId = '';

    await this.fetchAndRender();
  }

  prevPage() { 
    if (this.state.page > 1) { 
      this.state.page--; 
      this.fetchAndRender(); 
    } 
  }
  
  nextPage() { 
    if (this.state.page < this.maxPage) { 
      this.state.page++; 
      this.fetchAndRender(); 
    } 
  }
  
  onPageSizeChange() { 
    this.state.page = 1; 
    this.fetchAndRender(); 
  }

  async fetchAndRender() {
    let data: ApiPage;
    const base = { 
      page: this.state.page, 
      pageSize: this.state.pageSize 
    };
    
    const disableDates = this.todo;

    switch (this.state.tab) {
      case 'jugadores':
        data = await this.api.getJugadores({ 
          ...base, 
          equipo_id: this.state.equipoId || undefined,
          desde: disableDates ? undefined : (this.currentDates.desde || undefined),
          hasta: disableDates ? undefined : (this.currentDates.hasta || undefined)
        });
        break;

      case 'equipos':
        data = await this.api.getEquipos({
          ...base,
          desde: disableDates ? undefined : (this.currentDates.desde || undefined),
          hasta: disableDates ? undefined : (this.currentDates.hasta || undefined)
        });
        break;

      case 'partidos':
        data = await this.api.getPartidos({
          ...base,
          desde: disableDates ? undefined : (this.currentDates.desde || undefined),
          hasta: disableDates ? undefined : (this.currentDates.hasta || undefined)
        });
        break;

      case 'roster':
        data = await this.api.getRoster({ 
          ...base, 
          partido_id: this.state.partidoId || undefined,
          desde: disableDates ? undefined : (this.currentDates.desde || undefined),
          hasta: disableDates ? undefined : (this.currentDates.hasta || undefined)
        });
        break;
    }

    this.state.columns = data.columns;
    this.state.rows = data.rows;
    this.state.total = data.total;
  }

  exportPDF() {
    const disableDates = this.todo;
    const baseParams = {
      all: this.todo,
      page: this.state.page,
      pageSize: this.state.pageSize,
      desde: disableDates ? undefined : (this.currentDates.desde || undefined),
      hasta: disableDates ? undefined : (this.currentDates.hasta || undefined)
    };

    let url: string;

    switch (this.state.tab) {
      case 'jugadores':
        url = this.api.getJugadoresPdfUrl({
          ...baseParams,
          equipo_id: this.state.equipoId || undefined
        });
        break;

      case 'equipos':
        url = this.api.getEquiposPdfUrl(baseParams);
        break;

      case 'partidos':
        url = this.api.getPartidosPdfUrl(baseParams);
        break;

      case 'roster':
        url = this.api.getRosterPdfUrl({
          ...baseParams,
          partido_id: this.state.partidoId || undefined
        });
        break;
    }

    window.open(url, '_blank');
  }
}