import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquiposService } from './equipos.service';
import { Team } from './equipos.model';

/* Pipe simple para el buscador */
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
  selector: 'app-equipos',
  imports: [CommonModule, FormsModule, FilterByPipe],
  templateUrl: './equipos.component.html',
  styleUrls: ['../../../styles-faseII.scss']
})
export class EquiposComponent implements OnInit {
  equipos: Team[] = [];
  filtro = '';

  // modales
  showEdit = false;
  showNew = false;
  showConfirm = false;
  showBlocked = false;

  // form / selección
  form: Partial<Team> = {};
  selectedId: number | null = null;
  selectedName = '';

  // error de nombre duplicado (para ambos modales)
  nameError = '';

  // info para modal
  confirmInfo: {
    canDelete: boolean;
    totalJugadores: number;
    jugadores: Array<{id:number; nombres:string; apellidos:string; dorsal?: number}>;
    partidos: { total:number; programado:number; enCurso:number; finalizado:number; cancelado:number; suspendido:number };
  } = {
    canDelete: true,
    totalJugadores: 0,
    jugadores: [],
    partidos: { total:0, programado:0, enCurso:0, finalizado:0, cancelado:0, suspendido:0 }
  };

  constructor(private service: EquiposService) {}

  ngOnInit(): void { this.load(); }

  private load() {
    this.service.getAll().subscribe({
      next: (rows) => this.equipos = rows,
      error: () => (this.equipos = [])
    });
  }

  /* ====== Duplicados (cliente) ====== */
  private existsName(nombre: string, exceptId?: number | null): boolean {
    const needle = (nombre || '').trim().toLowerCase();
    if (!needle) return false;
    return this.equipos.some(e =>
      e.nombre?.trim().toLowerCase() === needle &&
      (exceptId == null || e.id !== exceptId)
    );
  }
  clearNameError() { this.nameError = ''; }

  /* ====== Abrir / Guardar ====== */
  openEdit(t: Team) {
    this.selectedId = t.id;
    this.form = {
      nombre: t.nombre,
      ciudad: t.ciudad,
      abreviatura: t.abreviatura,
      activo: t.activo,
      fecha_creacion: t.fecha_creacion,
      logo: t.logo
    };
    this.nameError = '';
    this.showEdit = true;
  }

  saveEdit() {
    if (!this.selectedId) return;
    const nombre = (this.form.nombre ?? '').trim();
    const cambios = {
      nombre,
      ciudad: (this.form.ciudad ?? '').trim(),
      abreviatura: (this.form.abreviatura ?? '').trim(),
      activo: !!this.form.activo,
      logo: this.form.logo
    };

    // Validación en cliente: nombre duplicado (excluye el propio id)
    if (this.existsName(nombre, this.selectedId)) {
      this.nameError = 'No se puede usar un nombre de equipo que ya existe.';
      return;
    }

    this.service.update(this.selectedId, cambios).subscribe({
      next: () => {
        this.load();
        this.closeModals();
      },
      error: (err) => {
        // Si backend devuelve 409 (carrera o validación), mostramos el mismo mensaje
        if (err?.status === 409) {
          this.nameError = (err?.error?.error || 'No se puede usar un nombre de equipo que ya existe.');
        }
      }
    });
  }

  openNew() {
    this.selectedId = null;
    this.form = {
      nombre: '',
      ciudad: '',
      abreviatura: '',
      activo: true,
      fecha_creacion: this.service.todayStr(),
      logo: ''
    };
    this.nameError = '';
    this.showNew = true;
  }

  onLogoSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.form.logo = String(reader.result); };
    reader.readAsDataURL(file);
  }

  saveNew() {
    const nombre = (this.form.nombre || '').trim();
    const ciudad = (this.form.ciudad || '').trim();
    const abreviatura = (this.form.abreviatura || '').trim();
    const fecha = (this.form.fecha_creacion || this.service.todayStr());
    if (!nombre || !ciudad || !abreviatura) return;

    // Validación en cliente: nombre duplicado
    if (this.existsName(nombre)) {
      this.nameError = 'No se puede crear otro equipo con el mismo nombre.';
      return;
    }

    this.service.create({
      id: 0,
      nombre,
      ciudad,
      abreviatura,
      activo: !!this.form.activo,
      fecha_creacion: fecha,
      logo: this.form.logo || undefined
    }).subscribe({
      next: () => {
        this.load();
        this.closeModals();
      },
      error: (err) => {
        // Refuerzo por si el backend detecta duplicado (409)
        if (err?.status === 409) {
          this.nameError = (err?.error?.error || 'No se puede crear otro equipo con el mismo nombre.');
        }
      }
    });
  }

  /* ====== Eliminar ====== */
  requestDelete(t: Team) {
    this.selectedId = t.id;
    this.selectedName = t.nombre || '';
    this.service.getDeleteInfo(t.id).subscribe({
      next: info => {
        this.confirmInfo = info;
        this.showConfirm = true;
      },
      error: () => {
        this.confirmInfo = {
          canDelete: true,
          totalJugadores: 0,
          jugadores: [],
          partidos: { total:0, programado:0, enCurso:0, finalizado:0, cancelado:0, suspendido:0 }
        };
        this.showConfirm = true;
      }
    });
  }

  doDelete() {
    if (!this.selectedId) return;

    if (this.confirmInfo.partidos.total > 0) {
      this.showConfirm = false;
      this.showBlocked = true;
      return;
    }

    this.service.delete(this.selectedId).subscribe({
      next: () => {
        this.load();
        this.closeModals();
      },
      error: (err) => {
        if (err?.status === 409) {
          this.showConfirm = false;
          this.showBlocked = true;
        } else if (err?.status === 404) {
          this.load();
          this.closeModals();
        } else {
          this.closeModals();
        }
      }
    });
  }

  /* ====== Util ====== */
  trackById(_: number, t: Team) { return t.id; }

  closeModals() {
    this.showEdit = this.showNew = this.showConfirm = this.showBlocked = false;
    this.form = {};
    this.selectedId = null;
    this.selectedName = '';
    this.nameError = '';
    this.confirmInfo = {
      canDelete: true,
      totalJugadores: 0,
      jugadores: [],
      partidos: { total:0, programado:0, enCurso:0, finalizado:0, cancelado:0, suspendido:0 }
    };
  }

  backdrop(ev: MouseEvent) {
    if ((ev.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModals();
    }
  }
}
