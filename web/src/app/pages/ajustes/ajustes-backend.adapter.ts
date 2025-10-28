import { inject } from '@angular/core';
import { AjustesApiService, UsuarioDto } from './ajustes-api.service';
import { AjustesComponent } from './ajustes.component';

type Usuario = InstanceType<typeof AjustesComponent>['usuarios'][number];

function mapUsuario(u: UsuarioDto): Usuario {
  return {
    id: u.id,
    usuario: u.usuario,
    primerNombre: u.primerNombre,
    segundoNombre: u.segundoNombre,
    primerApellido: u.primerApellido,
    segundoApellido: u.segundoApellido,
    correo: u.correo,
    activo: u.activo,
    rolId: u.rolId
  };
}

/**
 * Activa el backend en AjustesComponent sin modificar el archivo original.
 */
export function patchAjustesComponentBackend() {
  const proto = AjustesComponent.prototype as any;

  // Inyección perezosa del servicio
  Object.defineProperty(proto, '__api', {
    get() {
      if (!this.__apiCache) this.__apiCache = inject(AjustesApiService);
      return this.__apiCache;
    }
  });

  // Al primer uso de blankForm, traemos usuarios del backend (roles quedan fijos en el componente)
  const _blankForm = proto.blankForm;
  proto.blankForm = function(...args: any[]) {
    if (!this.__loadedFromApi) {
      this.__loadedFromApi = true;
      this.__api.getUsuarios().subscribe({
        next: (rows: UsuarioDto[]) => { this.usuarios = rows.map(mapUsuario); },
        error: () => {}
      });
    }
    return _blankForm.apply(this, args);
  };

  // crearUsuario => POST y refrescar usuarios
  const _crear = proto.crearUsuario;
  proto.crearUsuario = function(...args: any[]) {
    if (!this.valCrear()) return;
    const body = {
      usuario: (this.form.usuario || '').trim(),
      password: (this.form.password || '').trim(),
      primerNombre: (this.form.primerNombre || '').trim(),
      segundoNombre: (this.form.segundoNombre || '').trim() || undefined,
      primerApellido: (this.form.primerApellido || '').trim(),
      segundoApellido: (this.form.segundoApellido || '').trim() || undefined,
      correo: (this.form.correo || '').trim() || undefined,
      // El rolId sale del select de front (USUARIO o ADMINISTRADOR) y se manda tal cual
      rolId: Number(this.form.rolId || 2),
    };
    this.__api.crearUsuario(body).subscribe({
      next: () => {
        this.__api.getUsuarios().subscribe({
          next: (rows: UsuarioDto[]) => { this.usuarios = rows.map(mapUsuario); }
        });
        this.form = this.blankForm();
        this.editId = 0;
        alert('Usuario creado con éxito');
      },
      error: (err: any) => alert(err?.error || 'Error al crear usuario')
    });
  };

  // editarUsuario => PUT y refrescar
  const _editar = proto.editarUsuario;
  proto.editarUsuario = function(...args: any[]) {
    if (!this.valEditar()) return;
    const id = this.editId;
    const body = {
      usuario: (this.form.usuario || '').trim(),
      primerNombre: (this.form.primerNombre || '').trim(),
      segundoNombre: (this.form.segundoNombre || '').trim() || undefined,
      primerApellido: (this.form.primerApellido || '').trim(),
      segundoApellido: (this.form.segundoApellido || '').trim() || undefined,
      correo: (this.form.correo || '').trim() || undefined,
      rolId: Number(this.form.rolId || 2),
    };
    this.__api.editarUsuario(id, body).subscribe({
      next: () => {
        this.__api.getUsuarios().subscribe({
          next: (rows: UsuarioDto[]) => { this.usuarios = rows.map(mapUsuario); }
        });
        this.form = this.blankForm();
        this.editId = 0;
        alert('Usuario actualizado');
      },
      error: (err: any) => alert(err?.error || 'Error al actualizar')
    });
  };

  // toggleActivo => PATCH
  proto.toggleActivo = function(u: Usuario) {
    this.__api.toggleActivo(u.id, !u.activo).subscribe({
      next: () => { u.activo = !u.activo; },
      error: () => alert('No se pudo cambiar el estado')
    });
  };

  // eliminar => DELETE
  proto.eliminar = function(u: Usuario) {
    if (!confirm('¿Eliminar usuario?')) return;
    this.__api.eliminarUsuario(u.id).subscribe({
      next: () => {
        this.__api.getUsuarios().subscribe({
          next: (rows: UsuarioDto[]) => { this.usuarios = rows.map(mapUsuario); }
        });
        if (this.editId === u.id) { this.form = this.blankForm(); this.editId = 0; }
        alert('Usuario eliminado');
      },
      error: () => alert('No se pudo eliminar')
    });
  };

  // cambiarPassword => POST reset-password
  proto.cambiarPassword = function() {
    if (!this.valReset()) return;
    this.__api.resetPassword(this.reset.userId, this.reset.password).subscribe({
      next: () => {
        alert('Contraseña actualizada');
        this.reset = { userId: 0, password: '' };
        this.resetQuery = '';
        this.noResetResults = false;
      },
      error: () => alert('No se pudo actualizar la contraseña')
    });
  };
}
