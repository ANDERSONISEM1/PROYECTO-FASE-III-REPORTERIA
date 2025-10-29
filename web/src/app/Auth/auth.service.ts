import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  username: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API = environment.apiBase; // <- usa environment
  private APILOGIN = environment.apiBaseLogin;

  constructor(private http: HttpClient) { }

  // 1) Obtener la URL de autorización (incluye state firmado)
  getGithubUrl(): Promise<{ authorizeUrl: string; state: string }> {
    return firstValueFrom(
      this.http.get<{ authorizeUrl: string; state: string }>(
        `${this.APILOGIN}/auth/github/url`
      )
    );
  }

  login(username: string, password: string): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(
        `${this.APILOGIN}/auth/login`,
        { email: username, password },
        { withCredentials: false }
      )
    );
  }
  // 2) Iniciar GitHub OAuth
  async loginGithub() {
    const { authorizeUrl } = await this.getGithubUrl();
    window.location.href = authorizeUrl;
  }
  exchangeGithubCode(code: string, state: string): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(
        `${this.APILOGIN}/auth/github/exchange`,
        { code, state }
      )
    );
  }
  getMe(): Promise<Pick<LoginResponse, 'username' | 'roles'>> {
    return firstValueFrom(
      this.http.get<Pick<LoginResponse, 'username' | 'roles'>>(
        `${this.APILOGIN}/api/auth/me`,
        { withCredentials: true }
      )
    );
  }
  // 3) Iniciar Google OAuth
  async loginGoogle() {
    const { authorizeUrl } = await this.getGoogleUrl();
    window.location.href = authorizeUrl;
  }

  // 4) Intercambiar el code devuelto por Google
  exchangeGoogleCode(code: string, state: string): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(
        `${this.APILOGIN}/auth/google/exchange`,
        { code, state }
      )
    );
  }

  // Nuevo método auxiliar
  getGoogleUrl(): Promise<{ authorizeUrl: string; state: string }> {
    return firstValueFrom(
      this.http.get<{ authorizeUrl: string; state: string }>(
        `${this.APILOGIN}/auth/google/url`
      )
    );
  }
}
