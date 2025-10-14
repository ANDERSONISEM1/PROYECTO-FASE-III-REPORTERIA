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
  private API = environment.apiBase; // <- usa environment
  private APILOGIN = environment.apiBaseLogin;

  constructor(private http: HttpClient) { }

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
}
