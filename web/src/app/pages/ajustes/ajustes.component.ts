import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type RolNombre = 'ADMINISTRADOR' | 'USUARIO';

type Rol = { id: number; nombre: RolNombre; descripcion?: string };
type Usuario = {
  id: number;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  usuario: string;
  correo?: string;
  activo: boolean;
  rolId: number;
};

@Component({
  standalone: true,
  selector: 'app-ajustes',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="ajustes-container">
    <div class="ajustes-header">
      <h2>Ajustes</h2>
      <div class="muted">Gestión de usuarios, roles y contraseñas.</div>
    </div>

    <div class="ajustes-grid a3">
      <!-- === Crear / Editar Usuario === -->
      <div class="aj-card">
        <div class="aj-title">Crear / Editar Usuario</div>

        <!-- Identidad -->
        <div class="form-grid">
          <div class="form-col">
            <label>Primer nombre <span class="req">*</span></label>
            <input type="text" [(ngModel)]="form.primerNombre" />
          </div>
          <div class="form-col">
            <label>Segundo nombre</label>
            <input type="text" [(ngModel)]="form.segundoNombre" />
          </div>
        </div>

        <div class="form-grid mt12">
          <div class="form-col">
            <label>Primer apellido <span class="req">*</span></label>
            <input type="text" [(ngModel)]="form.primerApellido" />
          </div>
          <div class="form-col">
            <label>Segundo apellido</label>
            <input type="text" [(ngModel)]="form.segundoApellido" />
          </div>
        </div>

        <!-- Cuenta -->
        <div class="form-grid mt12">
          <div class="form-col">
            <label>Usuario</label>
            <input type="text" [(ngModel)]="form.usuario" placeholder="ej. jperez" />
          </div>
          <div class="form-col">
            <label>Correo</label>
            <input type="email" [(ngModel)]="form.correo" placeholder="nombre@dominio.com" />
          </div>
        </div>

        <div class="form-grid mt12">
          <!-- Contraseña solo al crear -->
          <div class="form-col" *ngIf="editId === 0">
            <label>Contraseña <span class="muted"></span></label>
            <input type="password" [(ngModel)]="form.password" placeholder="••••••••" />
          </div>
          <div class="form-col">
            <label>Rol</label>
            <select [(ngModel)]="form.rolId">
              <option *ngFor="let r of roles" [ngValue]="r.id">{{ r.nombre }}</option>
            </select>
          </div>
        </div>

        <div class="hint mt8" *ngIf="editId !== 0">
          La contraseña se cambia en <strong>Restablecer contraseña</strong>.
        </div>

        <div class="btn-row mt12">
          <button class="btn-primary" [disabled]="!valCrear()" (click)="crearUsuario()">Crear Usuario</button>
          <button class="btn-primary" [disabled]="!valEditar()" (click)="editarUsuario()">Guardar</button>
        </div>
      </div>

      <!-- === Restablecer contraseña === -->
      <div class="aj-card">
        <div class="aj-title">Restablecer contraseña</div>

        <div class="form-row">
          <label>Buscar usuario (unicamente por NO. usuario)</label>
          <div class="search-inline">
            <input
              type="text"
              [(ngModel)]="resetQuery"
              placeholder="Ej. 1001"
              (keydown.enter)="triggerResetSearch()"
            />
            <button type="button" class="btn-icon" (click)="triggerResetSearch()" title="Buscar">🔍</button>
          </div>
        </div>

        <div class="form-row mt12">
          <label>Seleccionado</label>
          <div
            class="input-like selected-input"
            [class.hasSel]="!!resetSelected"
            [class.error]="noResetResults"
          >
            <ng-container *ngIf="resetSelected; else placeholder">
              <div class="line1">
                {{ resetSelected.usuario }} — {{ nombreCompleto(resetSelected) }}
                <span class="muted small">• {{ resetSelected.correo || '—' }}</span>
              </div>
            </ng-container>
            <ng-template #placeholder>
              <span class="placeholder">
                {{ noResetResults ? 'No se encontró coincidencia' : '— Ninguno —' }}
              </span>
            </ng-template>
          </div>
        </div>

        <div class="form-row mt12">
          <label>Nueva contraseña</label>
          <input type="password" [(ngModel)]="reset.password" placeholder="••••••••" />
        </div>

        <div class="mt12">
          <button class="btn-primary" [disabled]="!valReset()" (click)="cambiarPassword()">Cambiar</button>
        </div>

        <div class="hint mt8">
          También puedes exigir rotación segura de sesión tras el cambio.
        </div>
      </div>

      <!-- === Resumen === -->
      <div class="aj-card">
        <div class="aj-title">Resumen</div>
        <div class="kpis">
          <div class="kpi"><div class="kpi-title">Usuarios</div><div class="kpi-value">{{ totalUsuarios }}</div></div>
          <div class="kpi"><div class="kpi-title">Activos</div><div class="kpi-value">{{ usuariosActivos }}</div></div>
          <div class="kpi"><div class="kpi-title">Roles</div><div class="kpi-value">{{ totalRoles }}</div></div>
        </div>
        <div class="roles-info">
          <div class="hint mt100"></div>
        </div>
      </div>
    </div>

    <!-- ===== Usuarios del sistema ===== -->
    <div class="aj-card mt16">
      <div class="aj-title">Usuarios del sistema</div>

      <div class="toolbar">
        <input class="search-box" type="text" placeholder="Buscar usuario, nombre o correo..."
               [(ngModel)]="filtroTexto">
        <select class="select-filter" [(ngModel)]="filtroRolId">
          <option [ngValue]="0">Todos los roles</option>
          <option *ngFor="let r of roles" [ngValue]="r.id">{{ r.nombre }}</option>
        </select>
      </div>

      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>USUARIO</th>
              <th>NOMBRE</th>
              <th>CORREO</th>
              <th>ROL</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of usuariosFiltrados(); trackBy: trackById">
              <td>{{ u.usuario }}</td>
              <td>{{ nombreCompleto(u) }}</td>
              <td>{{ u.correo || '—' }}</td>
              <td><span class="badge" [ngClass]="rolDe(u).nombre">{{ rolDe(u).nombre }}</span></td>
              <td>
                <span class="dot" [class.on]="u.activo"></span>
                <span class="muted">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td class="actions">
                <button class="btn-action" (click)="precargar(u)">Editar</button>
                <button class="btn-action" (click)="toggleActivo(u)">{{ u.activo ? 'Desactivar' : 'Activar' }}</button>
                <button class="btn-action danger" (click)="eliminar(u)">Eliminar</button>
              </td>
            </tr>
            <tr *ngIf="usuariosFiltrados().length === 0">
              <td colspan="6" class="empty">Sin resultados</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  `
})
export class AjustesComponent {
  // 🔒 Roles fijos en el front (no vienen de la BD)
  // Mantén los ids acordes a lo que espera tu backend (p.ej. 1 = ADMIN, 2 = USUARIO).
  roles: Rol[] = [
    { id: 1, nombre: 'ADMINISTRADOR', descripcion: 'Acceso total al panel' },
    { id: 2, nombre: 'USUARIO',       descripcion: 'Acceso limitado' },
  ];

  // 🔄 Ya no hay datos estáticos: se cargan desde backend por el adapter
  usuarios: Usuario[] = [];

  form: {
    primerNombre: string; segundoNombre?: string;
    primerApellido: string; segundoApellido?: string;
    usuario: string; correo?: string; password?: string; rolId: number;
  } = this.blankForm();

  editId = 0;

  // Reset password
  reset = { userId: 0, password: '' };
  resetQuery = '';
  noResetResults = false;

  // Filtros tabla
  filtroTexto = '';
  filtroRolId = 0;

  // KPIs
  get totalUsuarios() { return this.usuarios.length; }
  get usuariosActivos() { return this.usuarios.filter(u => u.activo).length; }
  get totalRoles() { return this.roles.length; }

  // Helpers
  trackById(_: number, u: Usuario) { return u.id; }
  rolDe(u: Usuario) { return this.roles.find(r => r.id === u.rolId)!; }
  nombreCompleto(u: Usuario) {
    return `${u.primerNombre} ${u.segundoNombre || ''} ${u.primerApellido} ${u.segundoApellido || ''}`
      .replace(/\s+/g,' ').trim();
  }
  get resetSelected(): Usuario | undefined {
    return this.usuarios.find(u => u.id === this.reset.userId);
  }

  usuariosFiltrados(): Usuario[] {
    const t = this.filtroTexto.trim().toLowerCase();
    return this.usuarios
      .filter(u => this.filtroRolId ? u.rolId === this.filtroRolId : true)
      .filter(u =>
        !t ||
        u.usuario.toLowerCase().includes(t) ||
        (u.correo || '').toLowerCase().includes(t) ||
        this.nombreCompleto(u).toLowerCase().includes(t)
      );
  }

  // Buscar y seleccionar directo
  triggerResetSearch() {
    const q = this.resetQuery.trim().toLowerCase();
    this.noResetResults = false;
    if (!q) { this.reset.userId = 0; return; }

    const match = this.usuarios.find(u => {
      const rol = this.rolDe(u)?.nombre.toLowerCase() || '';
      const estado = u.activo ? 'activo' : 'inactivo';
      return (
        u.usuario.toLowerCase().includes(q) ||
        (u.correo || '').toLowerCase().includes(q) ||
        this.nombreCompleto(u).toLowerCase().includes(q) ||
        rol.includes(q) ||
        estado.includes(q)
      );
    });

    if (match) this.pickResetUser(match);
    else { this.reset.userId = 0; this.noResetResults = true; }
  }

  pickResetUser(u: Usuario) { this.reset.userId = u.id; }

  // Crear/Editar
  valCrear() {
    return this.editId === 0 &&
           !!this.form.primerNombre?.trim() && !!this.form.primerApellido?.trim() &&
           !!this.form.usuario?.trim() && !!this.form.password?.trim();
  }
  valEditar() {
    return this.editId > 0 &&
           !!this.form.primerNombre?.trim() && !!this.form.primerApellido?.trim() &&
           !!this.form.usuario?.trim();
  }

  // Estos métodos son “parchados” por el adapter para llamar al backend.
  crearUsuario() { /* adapter lo reemplaza */ }
  editarUsuario() { /* adapter lo reemplaza */ }

  precargar(u: Usuario) {
    this.editId = u.id;
    const f = {
      primerNombre: u.primerNombre,
      segundoNombre: u.segundoNombre,
      primerApellido: u.primerApellido,
      segundoApellido: u.segundoApellido,
      usuario: u.usuario,
      correo: u.correo,
      password: '', // no editable aquí
      rolId: u.rolId
    };
    this.form = f;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Reset password (el adapter lo envía al backend)
  valReset() { return this.reset.userId > 0 && !!this.reset.password?.trim(); }
  cambiarPassword() { /* adapter lo reemplaza */ }

  // Acciones de la tabla (el adapter habla con backend)
  toggleActivo(u: Usuario) { /* adapter lo reemplaza */ }
  eliminar(u: Usuario) { /* adapter lo reemplaza */ }

  // Helpers internos
  private blankForm() {
    return {
      primerNombre: '', segundoNombre: '',
      primerApellido: '', segundoApellido: '',
      usuario: '', correo: '', password: '', rolId: 2 // por defecto: USUARIO
    };
  }
}
