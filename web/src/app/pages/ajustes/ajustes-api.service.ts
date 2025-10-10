import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type RolNombre = 'ADMIN'|'USUARIO';

export interface RolDto { id: number; nombre: RolNombre; }
export interface UsuarioDto {
  id: number; usuario: string;
  primerNombre: string; segundoNombre?: string;
  primerApellido: string; segundoApellido?: string;
  correo?: string; activo: boolean; rolId: number; rolNombre: RolNombre;
}
export interface CrearUsuarioRequest {
  usuario: string; password: string;
  primerNombre: string; segundoNombre?: string;
  primerApellido: string; segundoApellido?: string;
  correo?: string; rolId: number;
}
export interface EditarUsuarioRequest {
  usuario: string;
  primerNombre: string; segundoNombre?: string;
  primerApellido: string; segundoApellido?: string;
  correo?: string; rolId: number;
}

@Injectable({ providedIn: 'root' })
export class AjustesApiService {
  private readonly api = `${environment.apiBase}/api/ajustes`;
  constructor(private http: HttpClient) {}

  getRoles(): Observable<RolDto[]> {
    return this.http.get<RolDto[]>(`${this.api}/roles`);
  }
  getUsuarios(): Observable<UsuarioDto[]> {
    return this.http.get<UsuarioDto[]>(`${this.api}/usuarios`);
  }
  crearUsuario(req: CrearUsuarioRequest) {
    return this.http.post<{id:number}>(`${this.api}/usuarios`, req);
  }
  editarUsuario(id: number, req: EditarUsuarioRequest) {
    return this.http.put<void>(`${this.api}/usuarios/${id}`, req);
  }
  toggleActivo(id: number, activo: boolean) {
    return this.http.patch<void>(`${this.api}/usuarios/${id}/activo`, { activo });
  }
  eliminarUsuario(id: number) {
    return this.http.delete<void>(`${this.api}/usuarios/${id}`);
  }
  resetPassword(userId: number, password: string) {
    return this.http.post<void>(`${this.api}/usuarios/reset-password`, { userId, password, rotarSesion: true });
  }
}
