import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorage } from './token-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private store: TokenStorage) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.store.accessToken || localStorage.getItem('token') || '';

    // Bases configuradas
    const API_BASE = environment.apiBase;       // https://uniondeprofesionales.com/api
    const AUTH_BASE = environment.apiBaseLogin; // https://uniondeprofesionales.com/auth/

    // No incluir token al hacer login
    const isLogin = req.url === `${AUTH_BASE}login`;

    // Solo agregar Bearer a llamadas del backend o del login protegido (/auth/api/)
    const needsBearer =
      req.url.startsWith(API_BASE) ||
      req.url.startsWith(`${AUTH_BASE}api/`);

    if (!token || isLogin || !needsBearer) {
      return next.handle(req);
    }

    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });

    return next.handle(authReq);
  }
}

