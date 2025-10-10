import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JugadoresService } from './jugadores.service';
import { EquipoLite, Jugador, Pos } from './jugadores.model';

/* ===== Pipe de filtro ===== */
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'filterBy', standalone: true })
export class FilterByPipe implements PipeTransform {
  transform<T extends { [k: string]: any }>(items: T[], term: string): T[] {
    if (!term) return items;
    const q = term.toLowerCase();
    return items.filter(i =>
      Object.values(i).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }
}

@Component({
  standalone: true,
  selector: 'app-jugadores',
  imports: [CommonModule, FormsModule, FilterByPipe],
  template: `
  <div class="jugadores-container">
    <div class="jugadores-header">
      <select class="select-filter" [(ngModel)]="filtroEquipoId" (change)="reload()">
        <option [ngValue]="0">Filtrar por equipo</option>
        <option *ngFor="let eq of equipos" [ngValue]="eq.id">{{ eq.nombre }}</option>
      </select>

      <input type="text" class="search-box" placeholder="Buscar jugador..." [(ngModel)]="filtroTexto">

      <button class="btn-primary" type="button" (click)="openNew()">Nuevo Jugador</button>
    </div>

    <div class="jugadores-table">
      <table>
        <thead>
          <tr>
            <th>NOMBRE</th>
            <th>DORSAL</th>
            <th>POSICIÓN</th>
            <th>ESTATURA</th>
            <th>EDAD</th>
            <th>NACIONALIDAD</th>
            <th>EQUIPO</th>
            <th>ACTIVO</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let j of playersFiltrados() | filterBy:filtroTexto; trackBy: trackById">
            <td>{{ j.nombres }} {{ j.apellidos }}</td>
            <td>{{ j.dorsal ?? '—' }}</td>
            <td>{{ j.posicion ?? '—' }}</td>
            <td>{{ j.estatura_cm ? (j.estatura_cm + ' cm') : '—' }}</td>
            <td>{{ j.edad ?? '—' }}</td>
            <td>{{ j.nacionalidad ?? '—' }}</td>
            <td>{{ nombreEquipo(j.equipoId) }}</td>
            <td>{{ j.activo ? 'si' : 'no' }}</td>
            <td class="actions">
              <button class="btn-action" type="button" (click)="openEdit(j)">Editar</button>
              <button class="btn-action danger" type="button" (click)="requestDelete(j)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ===== Modal: Editar Jugador ===== -->
  <div class="modal-backdrop" *ngIf="showEdit" (click)="backdrop($event)">
    <div class="modal-card edit">
      <div class="modal-header">
        <h3>Editar Jugador</h3>
        <button class="close-x" type="button" (click)="closeModals()">✖</button>
      </div>

      <!-- Banner error edición -->
      <div *ngIf="errorEditMsg" class="alert error">{{ errorEditMsg }}</div>

      <div class="modal-body">
        <div class="form-grid">
          <div class="form-col">
            <label>Nombres</label>
            <input type="text" [(ngModel)]="form.nombres" />
          </div>
          <div class="form-col">
            <label>Apellidos</label>
            <input type="text" [(ngModel)]="form.apellidos" />
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Dorsal</label>
            <input type="number" min="0" [(ngModel)]="form.dorsal" />
          </div>
          <div class="form-col">
            <label>Posición</label>
            <select [(ngModel)]="form.posicion">
              <option [ngValue]="'PG'">PG</option>
              <option [ngValue]="'SG'">SG</option>
              <option [ngValue]="'SF'">SF</option>
              <option [ngValue]="'PF'">PF</option>
              <option [ngValue]="'C'">C</option>
            </select>
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Estatura (cm)</label>
            <input type="number" min="100" [(ngModel)]="form.estatura_cm" />
          </div>
          <div class="form-col">
            <label>Edad</label>
            <input type="number" min="10" [(ngModel)]="form.edad" />
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Nacionalidad</label>
            <input type="text" maxlength="60" [(ngModel)]="form.nacionalidad" placeholder="Guatemalteca, MX, US..." />
          </div>
          <div class="form-col">
            <label>Equipo</label>
            <select [(ngModel)]="form.equipoId">
              <option *ngFor="let eq of equipos" [ngValue]="eq.id">{{ eq.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="form-row mt12">
          <label><input type="checkbox" [(ngModel)]="form.activo" /> Activo</label>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" (click)="closeModals()">Cancelar</button>
        <button class="btn-primary" type="button" (click)="saveEdit()">Guardar</button>
      </div>
    </div>
  </div>

  <!-- ===== Modal: Nuevo Jugador ===== -->
  <div class="modal-backdrop" *ngIf="showNew" (click)="backdrop($event)">
    <div class="modal-card edit">
      <div class="modal-header">
        <h3>Nuevo Jugador</h3>
        <button class="close-x" type="button" (click)="closeModals()">✖</button>
      </div>

      <!-- Banner error creación -->
      <div *ngIf="errorNewMsg" class="alert error">{{ errorNewMsg }}</div>

      <div class="modal-body">
        <div class="form-grid">
          <div class="form-col">
            <label>Nombres</label>
            <input type="text" [(ngModel)]="form.nombres" />
          </div>
          <div class="form-col">
            <label>Apellidos</label>
            <input type="text" [(ngModel)]="form.apellidos" />
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Dorsal</label>
            <input type="number" min="0" [(ngModel)]="form.dorsal" />
          </div>
          <div class="form-col">
            <label>Posición</label>
            <select [(ngModel)]="form.posicion">
              <option [ngValue]="'PG'">PG</option>
              <option [ngValue]="'SG'">SG</option>
              <option [ngValue]="'SF'">SF</option>
              <option [ngValue]="'PF'">PF</option>
              <option [ngValue]="'C'">C</option>
            </select>
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Estatura (cm)</label>
            <input type="number" min="100" [(ngModel)]="form.estatura_cm" />
          </div>
          <div class="form-col">
            <label>Edad</label>
            <input type="number" min="10" [(ngModel)]="form.edad" />
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Nacionalidad</label>
            <input type="text" maxlength="60" [(ngModel)]="form.nacionalidad" placeholder="Guatemalteca, MX, US..." />
          </div>
          <div class="form-col">
            <label>Equipo</label>
            <select [(ngModel)]="form.equipoId">
              <option *ngFor="let eq of equipos" [ngValue]="eq.id">{{ eq.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="form-row mt12">
          <label><input type="checkbox" [(ngModel)]="form.activo" /> Activo</label>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" (click)="closeModals()">Cancelar</button>
        <button class="btn-primary" type="button" (click)="saveNew()">Guardar</button>
      </div>
    </div>
  </div>

  <!-- ===== Modal: Confirmar Eliminación ===== -->
  <div class="modal-backdrop" *ngIf="showConfirm" (click)="backdrop($event)">
    <div class="modal-card confirm small">
      <div class="modal-header">
        <h3>Confirmación</h3>
        <button class="close-x" type="button" (click)="closeModals()">✖</button>
      </div>
      <div class="modal-body">
        <p>¿Estás seguro que deseas eliminar a <strong>{{ selectedName }}</strong>?</p>
        <small>Esta acción es permanente.</small>
      </div>
      <div class="modal-footer">
        <button type="button" (click)="closeModals()">Cancelar</button>
        <button class="btn-primary danger" type="button" (click)="doDelete()">Eliminar</button>
      </div>
    </div>
  </div>

  <!-- ===== Modal: No se puede eliminar (involucrado) ===== -->
  <div class="modal-backdrop" *ngIf="showCannotDelete" (click)="backdrop($event)">
    <div class="modal-card confirm small">
      <div class="modal-header">
        <h3>Aviso</h3>
        <button class="close-x" type="button" (click)="closeCannotDelete()">✖</button>
      </div>
      <div class="modal-body">
        <p><strong>{{ selectedName }}</strong> no puede eliminarse.</p>
        <p>Este jugador está involucrado en partidos. Elimína el partido y vuelve a intentar.</p>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" type="button" (click)="closeCannotDelete()">Entendido</button>
      </div>
    </div>
  </div>
  `,
  styleUrls: ['../../../styles-faseII.scss']
})
export class JugadoresComponent {
  equipos: EquipoLite[] = [];
  jugadores: Jugador[] = [];

  filtroEquipoId = 0;
  filtroTexto = '';

  showEdit = false;
  showNew = false;
  showConfirm = false;
  showCannotDelete = false;

  // mensajes de error visibles en los modales
  errorNewMsg = '';
  errorEditMsg = '';

  form: any = {};
  selectedId: number | null = null;
  selectedName = '';

  constructor(private service: JugadoresService) {
    this.init();
  }

  private init() {
    this.service.getEquipos().subscribe({
      next: eqs => { this.equipos = eqs; this.reload(); },
      error: () => { this.equipos = []; this.reload(); }
    });
  }

  reload() {
    this.service.list(this.filtroEquipoId).subscribe({
      next: rows => this.jugadores = rows,
      error: () => this.jugadores = []
    });
  }

  nombreEquipo(id: number) {
    return this.equipos.find(e => e.id === id)?.nombre ?? '—';
  }
  playersFiltrados(): Jugador[] { return this.jugadores; }
  trackById(_: number, j: Jugador) { return j.id; }

  /* ===== Editar ===== */
  openEdit(j: Jugador) {
    this.selectedId = j.id;
    this.errorEditMsg = '';
    this.form = {
      ...j,
      posicion: (j.posicion ?? 'PG') as Pos
    };
    this.showEdit = true;
  }
  saveEdit() {
    if (!this.selectedId) return;
    const f = this.form as Jugador;
    if (!String(f.nombres || '').trim() || !String(f.apellidos || '').trim()) return;

    const payload: Jugador = {
      id: this.selectedId,
      equipoId: Number(f.equipoId || 0),
      nombres: String(f.nombres || '').trim(),
      apellidos: String(f.apellidos || '').trim(),
      dorsal: f.dorsal != null ? Number(f.dorsal) : null,
      posicion: (f.posicion as Pos) ?? null,
      estatura_cm: f.estatura_cm != null ? Number(f.estatura_cm) : null,
      edad: f.edad != null ? Number(f.edad) : null,
      nacionalidad: f.nacionalidad ? String(f.nacionalidad).trim() : null,
      activo: !!f.activo
    };

    this.service.update(this.selectedId, payload).subscribe({
      next: () => { this.reload(); this.closeModals(); },
      error: (err) => {
        if (err?.status === 409) {
          this.errorEditMsg = err?.error?.error || 'No se puede repetir el mismo dorsal en el equipo.';
        } else {
          this.errorEditMsg = 'Error al actualizar el jugador.';
        }
      }
    });
  }

  /* ===== Nuevo ===== */
  openNew() {
    const defaultEquipo = this.equipos[0]?.id ?? 0;
    this.selectedId = null;
    this.errorNewMsg = '';
    this.form = {
      nombres: '',
      apellidos: '',
      dorsal: null,
      posicion: 'PG',
      estatura_cm: null,
      edad: null,
      nacionalidad: '',
      equipoId: this.filtroEquipoId || defaultEquipo,
      activo: true
    };
    this.showNew = true;
  }
  saveNew() {
    const f = this.form as Jugador;
    const nombres = String(f.nombres || '').trim();
    const apellidos = String(f.apellidos || '').trim();
    if (!nombres || !apellidos) return;

    const payload: Jugador = {
      id: 0,
      equipoId: Number(f.equipoId || 0),
      nombres,
      apellidos,
      dorsal: f.dorsal != null ? Number(f.dorsal) : null,
      posicion: (f.posicion as Pos) ?? null,
      estatura_cm: f.estatura_cm != null ? Number(f.estatura_cm) : null,
      edad: f.edad != null ? Number(f.edad) : null,
      nacionalidad: f.nacionalidad ? String(f.nacionalidad).trim() : null,
      activo: !!f.activo
    };

    this.service.create(payload).subscribe({
      next: () => { this.reload(); this.closeModals(); },
      error: (err) => {
        if (err?.status === 409) {
          this.errorNewMsg = err?.error?.error || 'No se puede repetir el mismo dorsal en el equipo.';
        } else {
          this.errorNewMsg = 'Error al crear jugador.';
        }
      }
    });
  }

  /* ===== Eliminar ===== */
  requestDelete(j: Jugador) {
    this.selectedId = j.id;
    this.selectedName = `${j.nombres} ${j.apellidos}`.trim();
    this.showConfirm = true;
  }
  doDelete() {
    if (!this.selectedId) return;
    this.service.delete(this.selectedId).subscribe({
      next: () => { this.reload(); this.closeModals(); },
      error: (err) => {
        if (err?.status === 409) {
          this.showConfirm = false;
          this.showCannotDelete = true;
        } else if (err?.status === 404) {
          this.closeModals();
          alert('El jugador ya no existe.');
          this.reload();
        } else {
          this.closeModals();
          alert('Ocurrió un error al eliminar.');
        }
      }
    });
  }

  /* ===== Utils ===== */
  closeModals() {
    this.showEdit = this.showNew = this.showConfirm = this.showCannotDelete = false;
    this.errorNewMsg = this.errorEditMsg = '';
    this.form = {};
    this.selectedId = null;
    this.selectedName = '';
  }
  closeCannotDelete() { this.showCannotDelete = false; }
  backdrop(ev: MouseEvent) {
    if ((ev.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModals();
    }
  }
}
