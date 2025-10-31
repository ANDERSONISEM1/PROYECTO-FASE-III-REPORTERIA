import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  username: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API = environment.apiBase;            // compat
  private APILOGIN = environment.apiBaseLogin;  // tu API de auth
  // base del frontend ya detrás de Cloudflare (si no está en env, usa origin actual)
  private FRONT = (environment as any).frontBase ?? window.location.origin;

  constructor(private http: HttpClient) {}

  // ----- Credenciales normales -----
  login(username: string, password: string): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(
        `${this.APILOGIN}/auth/login`,
        { email: username, password },
        { withCredentials: false }
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

  // =========================================================
  //                    OAUTH - GITHUB
  // =========================================================
  getGithubUrl(): Promise<{ authorizeUrl: string; state: string }> {
    return firstValueFrom(
      this.http.get<{ authorizeUrl: string; state: string }>(
        `${this.APILOGIN}/auth/github/url`
      )
    );
  }

  // ⬇️ Redirige a /edge-check primero (Cloudflare muestra el challenge),
  //    y luego a authorizeUrl
  async loginGithub() {
    const { authorizeUrl } = await this.getGithubUrl();
    this.redirectViaEdge(authorizeUrl);
  }

  exchangeGithubCode(code: string, state: string): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(
        `${this.APILOGIN}/auth/github/exchange`,
        { code, state }
      )
    );
  }

  // =========================================================
  //                    OAUTH - GOOGLE
  // =========================================================
  getGoogleUrl(): Promise<{ authorizeUrl: string; state: string }> {
    return firstValueFrom(
      this.http.get<{ authorizeUrl: string; state: string }>(
        `${this.APILOGIN}/auth/google/url`
      )
    );
  }

  async loginGoogle() {
    const { authorizeUrl } = await this.getGoogleUrl();
    this.redirectViaEdge(authorizeUrl);
  }

  exchangeGoogleCode(code: string, state: string): Promise<LoginResponse> {
    return firstValueFrom(
      this.http.post<LoginResponse>(
        `${this.APILOGIN}/auth/google/exchange`,
        { code, state }
      )
    );
  }

  // =========================================================
  //              Util: pasar por Cloudflare primero
  // =========================================================
  private redirectViaEdge(targetUrl: string) {
    const url = `${this.FRONT}/edge-check?to=${encodeURIComponent(targetUrl)}`;
    window.location.href = url; // Cloudflare intercepta /edge-check y muestra el challenge
  }
}
