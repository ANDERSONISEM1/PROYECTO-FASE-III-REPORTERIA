import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* ===== Tipos ===== */
type EstadoPartido = 'programado'|'en_curso'|'finalizado'|'cancelado'|'suspendido';
type Team   = { id: number; nombre: string };
type Player = { id: number; equipoId: number; nombre: string; dorsal?: number };
type Match = {
  id: number; equipo_local_id: number; equipo_visitante_id: number;
  fecha_hora_inicio: string; sede: string; estado: EstadoPartido;
  minutos_por_cuarto: number; cuartos_totales: number;
  faltas_por_equipo_limite: number; faltas_por_jugador_limite: number;
};
type RosterEntry = { partido_id: number; equipo_id: number; jugador_id: number; es_titular: boolean };

/* Servicio */
import { PartidosService } from './partidos.service';

@Component({
  standalone: true,
  selector: 'app-partidos',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="partidos-container">
    <div class="partidos-header">
      <h2>Partidos</h2>
      <button class="btn-primary" type="button" (click)="openNew()">Nuevo Partido</button>
    </div>

    <div class="partidos-table">
      <table>
        <thead>
          <tr>
            <th>ENCUENTRO</th>
            <th>FECHA/HORA</th>
            <th>SEDE</th>
            <th>ESTADO</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of partidos; trackBy: trackById">
            <td>{{ nombreEquipo(p.equipo_local_id) }} vs {{ nombreEquipo(p.equipo_visitante_id) }}</td>
            <td>{{ prettyFecha(p.fecha_hora_inicio) }}</td>
            <td>{{ p.sede || '—' }}</td>
            <td><span class="badge" [ngClass]="p.estado">{{ etiquetaEstado(p.estado) }}</span></td>
            <td class="actions">
              <button class="btn-action" type="button" (click)="openRosters(p)">Rosters</button>
              <button class="btn-action" type="button" (click)="openEdit(p)">Editar</button>
              <button class="btn-action danger" type="button" (click)="requestDelete(p)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ===== Nuevo Partido ===== -->
  <div class="modal-backdrop" *ngIf="showNew" (click)="backdrop($event)">
    <div class="modal-card edit">
      <div class="modal-header">
        <h3>Nuevo Partido</h3>
        <button class="close-x" (click)="closeModals()">✖</button>
      </div>

      <div *ngIf="errorNewMsg" class="alert error">{{ errorNewMsg }}</div>

      <div class="modal-body">
        <div class="form-grid">
          <div class="form-col">
            <label>Local</label>
            <select [(ngModel)]="form.equipo_local_id">
              <option *ngFor="let e of equipos" [ngValue]="e.id">{{ e.nombre }}</option>
            </select>
          </div>
          <div class="form-col">
            <label>Visitante</label>
            <select [(ngModel)]="form.equipo_visitante_id">
              <option *ngFor="let e of equipos" [ngValue]="e.id">{{ e.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Fecha / Hora</label>
            <input type="datetime-local" [(ngModel)]="form.fecha_hora_inicio" />
          </div>
          <div class="form-col">
            <label>Sede</label>
            <input type="text" [(ngModel)]="form.sede" />
          </div>
        </div>

        <div class="form-row mt12">
          <label>Estado</label>
          <select [(ngModel)]="form.estado">
            <option [ngValue]="'programado'">programado</option>
            <option [ngValue]="'en_curso'">en curso</option>
            <option [ngValue]="'finalizado'">finalizado</option>
            <option [ngValue]="'cancelado'">cancelado</option>
            <option [ngValue]="'suspendido'">suspendido</option>
          </select>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Minutos por cuarto</label>
            <input class="input-readonly" type="number" [readOnly]="true" [(ngModel)]="form.minutos_por_cuarto" />
          </div>
          <div class="form-col">
            <label>Cuartos totales</label>
            <input class="input-readonly" type="number" [readOnly]="true" [(ngModel)]="form.cuartos_totales" />
          </div>
        </div>
        <div class="form-grid mt12">
          <div class="form-col">
            <label>Faltas por equipo (límite)</label>
            <input class="input-readonly" type="number" [readOnly]="true" [(ngModel)]="form.faltas_por_equipo_limite" />
          </div>
          <div class="form-col">
            <label>Faltas por jugador (límite)</label>
            <input class="input-readonly" type="number" [readOnly]="true" [(ngModel)]="form.faltas_por_jugador_limite" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button (click)="closeModals()">Cancelar</button>
        <button class="btn-primary" (click)="saveNew()">Guardar</button>
      </div>
    </div>
  </div>

  <!-- ===== Editar Partido ===== -->
  <div class="modal-backdrop" *ngIf="showEdit" (click)="backdrop($event)">
    <div class="modal-card edit">
      <div class="modal-header">
        <h3>Editar Partido</h3>
        <button class="close-x" (click)="closeModals()">✖</button>
      </div>

      <div *ngIf="errorEditMsg" class="alert error">{{ errorEditMsg }}</div>

      <div class="modal-body">
        <div class="form-grid">
          <div class="form-col">
            <label>Local</label>
            <select [(ngModel)]="form.equipo_local_id">
              <option *ngFor="let e of equipos" [ngValue]="e.id">{{ e.nombre }}</option>
            </select>
          </div>
          <div class="form-col">
            <label>Visitante</label>
            <select [(ngModel)]="form.equipo_visitante_id">
              <option *ngFor="let e of equipos" [ngValue]="e.id">{{ e.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Fecha / Hora</label>
            <input type="datetime-local" [(ngModel)]="form.fecha_hora_inicio" />
          </div>
          <div class="form-col">
            <label>Sede</label>
            <input type="text" [(ngModel)]="form.sede" />
          </div>
        </div>

        <div class="form-row mt12">
          <label>Estado</label>
          <select [(ngModel)]="form.estado">
            <option [ngValue]="'programado'">programado</option>
            <option [ngValue]="'en_curso'">en curso</option>
            <option [ngValue]="'finalizado'">finalizado</option>
            <option [ngValue]="'cancelado'">cancelado</option>
            <option [ngValue]="'suspendido'">suspendido</option>
          </select>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Minutos por cuarto</label>
            <input class="input-readonly" type="number" [readOnly]="true" [(ngModel)]="form.minutos_por_cuarto" />
          </div>
          <div class="form-col">
            <label>Cuartos totales</label>
            <input class="input-readonly" type="number" [readOnly]="true" [(ngModel)]="form.cuartos_totales" />
          </div>
        </div>
        <div class="form-grid mt12">
          <div class="form-col">
            <label>Faltas por equipo (límite)</label>
            <input class="input-readonly" type="number" [readOnly]="true" [(ngModel)]="form.faltas_por_equipo_limite" />
          </div>
          <div class="form-col">
            <label>Faltas por jugador (límite)</label>
            <input class="input-readonly" type="number" [readOnly]="true" [(ngModel)]="form.faltas_por_jugador_limite" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button (click)="closeModals()">Cancelar</button>
        <button class="btn-primary" (click)="saveEdit()">Guardar</button>
      </div>
    </div>
  </div>

  <!-- ===== Confirmar Eliminación ===== -->
  <div class="modal-backdrop" *ngIf="showConfirm" (click)="backdrop($event)">
    <div class="modal-card confirm small">
      <div class="modal-header">
        <h3>Confirmar</h3>
        <button class="close-x" (click)="closeModals()">✖</button>
      </div>
      <div class="modal-body">
        <p class="mb8">
          ¿Estás seguro que deseas eliminar el partido?
          Se eliminarán también las anotaciones, faltas, 
          tiempos muertos, eventos de cronómetro, 
          cuartos y roster relacionados.
        </p>
        <p class="muted">
          {{ nombreEquipo(confirmCtx.localId) }} vs {{ nombreEquipo(confirmCtx.visitaId) }} — {{ prettyFecha(confirmCtx.fecha) }}
        </p>
      </div>
      <div class="modal-footer">
        <button (click)="closeModals()">No</button>
        <button class="btn-primary danger" (click)="doDelete()">Sí</button>
      </div>
    </div>
  </div>

  <!-- ===== Rosters (solo "Titular" + contador 5/5) ===== -->
  <div class="modal-backdrop" *ngIf="showRosters" (click)="backdrop($event)">
    <div class="modal-card roster">
      <div class="modal-header">
        <h3>Rosters — {{ nombreEquipo(rosterCtx.localId) }} vs {{ nombreEquipo(rosterCtx.visitaId) }}</h3>
        <button class="close-x" (click)="closeModals()">✖</button>
      </div>
      <div class="modal-body roster-body">
        <div class="roster-col">
          <div class="roster-title">
            Local — {{ nombreEquipo(rosterCtx.localId) }}
            <span class="muted" style="margin-left:8px;">Titulares: {{countTitulares('local')}}/5</span>
          </div>
          <div class="roster-list">
            <label *ngFor="let j of jugadoresEquipo(rosterCtx.localId); trackBy: trackByJugador">
              <span class="name">{{ j.nombre }}</span>
              <span class="muted">#{{ j.dorsal || '—' }}</span>
              <span class="spacer"></span>
              <label class="titular">
                <input type="checkbox"
                       [checked]="rosterSeleccion.local[j.id] === true"
                       (change)="toggleTitular('local', j.id, $event)" />
                Titular
              </label>
            </label>
          </div>
        </div>

        <div class="roster-col">
          <div class="roster-title">
            Visitante — {{ nombreEquipo(rosterCtx.visitaId) }}
            <span class="muted" style="margin-left:8px;">Titulares: {{countTitulares('visita')}}/5</span>
          </div>
          <div class="roster-list">
            <label *ngFor="let j of jugadoresEquipo(rosterCtx.visitaId); trackBy: trackByJugador">
              <span class="name">{{ j.nombre }}</span>
              <span class="muted">#{{ j.dorsal || '—' }}</span>
              <span class="spacer"></span>
              <label class="titular">
                <input type="checkbox"
                       [checked]="rosterSeleccion.visita[j.id] === true"
                       (change)="toggleTitular('visita', j.id, $event)" />
                Titular
              </label>
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <small class="muted">Máximo 5 titulares por equipo.</small>
        <span class="spacer"></span>
        <button (click)="closeModals()">Cancelar</button>
        <button class="btn-primary" (click)="saveRosters()">Guardar</button>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['../../../styles-faseII.scss']
})
export class PartidosComponent {
  // Datos
  equipos: Team[] = [];
  jugadores: Player[] = [];
  partidos: Match[] = [];
  rosterPartido: RosterEntry[] = [];

  // UI state
  showNew = false; showEdit = false; showConfirm = false; showRosters = false;
  form: Partial<Match> = {};
  selectedId: number | null = null;

  // Roster
  rosterCtx = { partidoId: 0, localId: 0, visitaId: 0 };
  rosterSeleccion: { local: Record<number, boolean>, visita: Record<number, boolean> } = { local: {}, visita: {} };

  // Banners error
  errorNewMsg = ''; errorEditMsg = '';

  // Confirmación
  confirmCtx = { localId: 0, visitaId: 0, fecha: '' };

  constructor(private service: PartidosService) { this.init(); }

  /* ===== Carga inicial ===== */
  private init() {
    this.service.getEquipos().subscribe({
      next: rows => this.equipos = (rows || []).map((r: any) => ({ id: r.id, nombre: r.nombre })),
      error: () => this.equipos = []
    });

    this.service.getJugadores().subscribe({
      next: rows => this.jugadores = (rows || []).map((j: any) => ({
        id: j.id, equipoId: j.equipoId, nombre: `${j.nombres} ${j.apellidos}`.trim(), dorsal: j.dorsal ?? undefined
      })),
      error: () => this.jugadores = []
    });

    this.reload();
  }

  private reload() {
    this.service.list().subscribe({
      next: rows => this.partidos = rows,
      error: () => this.partidos = []
    });
  }

  /* ===== Helpers ===== */
  trackById(_: number, p: Match) { return p.id; }
  trackByJugador(_: number, j: Player) { return j.id; }
  nombreEquipo(id: number) { return this.equipos.find(e => e.id === id)?.nombre ?? '—'; }
  etiquetaEstado(e: EstadoPartido) { return e === 'en_curso' ? 'en curso' : e; }
  prettyFecha(v: string) { return v ? new Date(v).toLocaleString() : '—'; }
  toLocalInputValue(d: Date) { const pad = (n:number)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
  jugadoresEquipo(equipoId: number) { return this.jugadores.filter(j => j.equipoId === equipoId); }

  /* ===== CRUD ===== */
  openNew() {
    const ahora = this.toLocalInputValue(new Date());
    const l = this.equipos[0]?.id ?? 0;
    const v = this.equipos.find(e => e.id !== l)?.id ?? l;
    this.errorNewMsg = '';
    this.form = {
      equipo_local_id: l,
      equipo_visitante_id: v,
      fecha_hora_inicio: ahora,
      sede: '',
      estado: 'programado',
      minutos_por_cuarto: 10,
      cuartos_totales: 4,
      faltas_por_equipo_limite: 255,
      faltas_por_jugador_limite: 5,
    };
    this.selectedId = null; this.showNew = true;
  }

  saveNew() {
    const f = this.form;
    this.errorNewMsg = '';
    if (!f?.equipo_local_id || !f?.equipo_visitante_id) return;
    if (f.equipo_local_id === f.equipo_visitante_id) { this.errorNewMsg = 'No se puede elegir los mismos equipos; elige uno diferente.'; return; }
    if (!f.fecha_hora_inicio) return;

    const payload: Match = {
      id: 0,
      equipo_local_id: Number(f.equipo_local_id),
      equipo_visitante_id: Number(f.equipo_visitante_id),
      fecha_hora_inicio: String(f.fecha_hora_inicio),
      sede: (f.sede ?? '').trim(),
      estado: (f.estado as EstadoPartido) ?? 'programado',
      minutos_por_cuarto: 10,
      cuartos_totales: 4,
      faltas_por_equipo_limite: 255,
      faltas_por_jugador_limite: 5,
    };

    this.service.create(payload).subscribe({
      next: () => { this.reload(); this.closeModals(); },
      error: (err) => { this.errorNewMsg = err?.error?.error || 'Error al crear partido.'; }
    });
  }

  openEdit(p: Match) { this.selectedId = p.id; this.form = { ...p }; this.errorEditMsg = ''; this.showEdit = true; }

  saveEdit() {
    if (!this.selectedId) return;
    const f = this.form;
    this.errorEditMsg = '';
    if (!f?.equipo_local_id || !f?.equipo_visitante_id) return;
    if (f.equipo_local_id === f.equipo_visitante_id) { this.errorEditMsg = 'No se puede elegir los mismos equipos; elige uno diferente.'; return; }
    if (!f.fecha_hora_inicio) return;

    const payload: Match = {
      id: this.selectedId,
      equipo_local_id: Number(f.equipo_local_id),
      equipo_visitante_id: Number(f.equipo_visitante_id),
      fecha_hora_inicio: String(f.fecha_hora_inicio),
      sede: (f.sede ?? '').trim(),
      estado: (f.estado as EstadoPartido) ?? 'programado',
      minutos_por_cuarto: 10,
      cuartos_totales: 4,
      faltas_por_equipo_limite: 255,
      faltas_por_jugador_limite: 5,
    };

    this.service.update(this.selectedId, payload).subscribe({
      next: () => { this.reload(); this.closeModals(); },
      error: (err) => { this.errorEditMsg = err?.error?.error || 'Error al actualizar partido.'; }
    });
  }

  requestDelete(p: Match) {
    this.selectedId = p.id;
    this.confirmCtx = { localId: p.equipo_local_id, visitaId: p.equipo_visitante_id, fecha: p.fecha_hora_inicio };
    this.showConfirm = true;
  }

  doDelete() {
    if (!this.selectedId) return;
    const id = this.selectedId;
    this.service.delete(id).subscribe({
      next: () => { this.reload(); this.closeModals(); },
      error: (err) => {
        this.closeModals();
        if (err?.status === 404) {
          alert('El partido ya no existe.');
          this.reload();
        } else {
          alert('Ocurrió un error al eliminar.');
        }
      }
    });
  }

  /* ===== ROSTERS ===== */
  openRosters(p: Match) {
    this.rosterCtx = { partidoId: p.id, localId: p.equipo_local_id, visitaId: p.equipo_visitante_id };

    const initFalse = (equipoId: number) => {
      const m: Record<number, boolean> = {};
      for (const j of this.jugadoresEquipo(equipoId)) m[j.id] = false;
      return m;
    };
    this.rosterSeleccion = { local: initFalse(p.equipo_local_id), visita: initFalse(p.equipo_visitante_id) };

    this.service.getRoster(p.id).subscribe({
      next: rows => {
        this.rosterPartido = rows;
        for (const r of rows) {
          if (r.es_titular) {
            if (r.equipo_id === p.equipo_local_id)   this.rosterSeleccion.local[r.jugador_id]   = true;
            if (r.equipo_id === p.equipo_visitante_id) this.rosterSeleccion.visita[r.jugador_id] = true;
          }
        }
        this.showRosters = true;
      },
      error: () => { this.showRosters = true; }
    });
  }

  countTitulares(side: 'local'|'visita'): number {
    const map = this.rosterSeleccion[side];
    return Object.values(map).filter(v => v === true).length;
  }

  toggleTitular(side: 'local'|'visita', jugadorId: number, ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    const actual = this.countTitulares(side);
    if (checked && actual >= 5) {
      (ev.target as HTMLInputElement).checked = false;
      return;
    }
    this.rosterSeleccion[side][jugadorId] = checked;
  }

  saveRosters() {
    const pid = this.rosterCtx.partidoId;

    const collect = (equipoId: number, sel: Record<number, boolean>): RosterEntry[] =>
      Object.keys(sel)
        .filter(k => sel[Number(k)] === true)
        .map(k => ({ partido_id: pid, equipo_id: equipoId, jugador_id: Number(k), es_titular: true }));

    const items = [
      ...collect(this.rosterCtx.localId,  this.rosterSeleccion.local),
      ...collect(this.rosterCtx.visitaId, this.rosterSeleccion.visita),
    ];

    this.service.saveRoster(pid, items).subscribe({
      next: () => { this.rosterPartido = items; this.closeModals(); },
      error: (err) => { alert(err?.error?.error || 'Error al guardar roster.'); }
    });
  }

  /* ===== Util ===== */
  closeModals() {
    this.showNew = this.showEdit = this.showConfirm = this.showRosters = false;
    this.errorNewMsg = this.errorEditMsg = '';
    this.form = {}; this.selectedId = null;
  }
  backdrop(ev: MouseEvent) {
    if ((ev.target as HTMLElement).classList.contains('modal-backdrop')) this.closeModals();
  }
}
