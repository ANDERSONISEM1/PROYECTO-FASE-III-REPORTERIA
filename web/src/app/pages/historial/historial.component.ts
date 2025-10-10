import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Tipos front-only */
type Estado = 'programado'|'en_curso'|'finalizado'|'cancelado'|'suspendido';
type Team = { id: number; nombre: string };

type Partido = {
  id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  fecha_hora_inicio: string; // ISO
  sede: string;
  estado: Estado;
  // marcador final (back: vw_MarcadorPartido)
  puntos_local: number;
  puntos_visitante: number;
};

/* Servicio acoplado al backend */
import { HistorialService } from './historial.service';

@Component({
  standalone: true,
  selector: 'app-historial',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="historial-container">
    <div class="historial-header">
      <h2>Historial de Partidos</h2>

      <div class="filters">
        <select class="select-filter" [(ngModel)]="filtroEquipoId" (ngModelChange)="onFilterEquipoChange()">
          <option [ngValue]="0">Todos los equipos</option>
          <option *ngFor="let e of equipos" [ngValue]="e.id">{{ e.nombre }}</option>
        </select>

        <input class="search-box" type="text" placeholder="Buscar encuentro o sede..." [(ngModel)]="filtroTexto">
      </div>
    </div>

    <div class="historial-table">
      <table>
        <thead>
          <tr>
            <th>ENCUENTRO</th>
            <th>FECHA</th>
            <th>SEDE</th>
            <th>MARCADOR</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of partidosFiltrados(); trackBy: trackById">
            <td>{{ nombreEquipo(p.equipo_local_id) }} vs {{ nombreEquipo(p.equipo_visitante_id) }}</td>
            <td>{{ formatFecha(p.fecha_hora_inicio) }}</td>
            <td>{{ p.sede || '—' }}</td>
            <td>{{ p.puntos_local }} - {{ p.puntos_visitante }}</td>
          </tr>
          <tr *ngIf="partidosFiltrados().length === 0">
            <td colspan="4" class="empty">Sin resultados</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  `,
  styleUrls: ['../../../styles-faseII.scss']
})
export class HistorialComponent {

  equipos: Team[] = [];
  partidos: Partido[] = [];

  /** Filtros */
  filtroEquipoId = 0; // 0 = todos
  filtroTexto = '';

  constructor(private service: HistorialService) {
    this.init();
  }

  /** Carga inicial */
  private init() {
    this.service.getEquipos().subscribe({
      next: (rows) => this.equipos = rows,
      error: () => this.equipos = []
    });

    this.loadPartidos();
  }

  private loadPartidos() {
    const eq = this.filtroEquipoId > 0 ? this.filtroEquipoId : undefined;
    this.service.getPartidos(eq).subscribe({
      next: (rows) => this.partidos = rows,
      error: () => this.partidos = []
    });
  }

  onFilterEquipoChange() {
    // Recargamos desde back cuando cambia el equipo (para no traer todo si no quieres)
    this.loadPartidos();
  }

  /** Helpers */
  trackById(_: number, p: Partido) { return p.id; }
  nombreEquipo(id: number) { return this.equipos.find(e => e.id === id)?.nombre ?? '—'; }
  formatFecha(iso: string) { return iso ? new Date(iso).toLocaleString() : '—'; }

  partidosFiltrados(): Partido[] {
    return (this.partidos || [])
      .filter(p => p.estado === 'finalizado')
      .filter(p => this.filtroEquipoId
        ? (p.equipo_local_id === this.filtroEquipoId || p.equipo_visitante_id === this.filtroEquipoId)
        : true
      )
      .filter(p => {
        if (!this.filtroTexto.trim()) return true;
        const q = this.filtroTexto.toLowerCase();
        const enc = `${this.nombreEquipo(p.equipo_local_id)} vs ${this.nombreEquipo(p.equipo_visitante_id)}`.toLowerCase();
        return enc.includes(q) || (p.sede || '').toLowerCase().includes(q);
      })
      .sort((a,b) => (b.fecha_hora_inicio || '').localeCompare(a.fecha_hora_inicio || ''));
  }
}
