import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type Session = {
  accessToken: string;
  roles: string[];
  username: string;
  expiresAtUtc?: string;
};

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private K = 'mb_session';

  private rolesSubject = new BehaviorSubject<string[]>([]);
  roles$ = this.rolesSubject.asObservable();

  setSession(s: Session) {
    localStorage.setItem(this.K, JSON.stringify(s));
    this.rolesSubject.next(s.roles || []);
  }

  updateRoles(roles: string[]) {
    const raw = this.raw;
    const next: Session | null = raw ? { ...raw, roles: roles || [] } : null;
    if (next) {
      localStorage.setItem(this.K, JSON.stringify(next));
      this.rolesSubject.next(next.roles);
    }
  }

  clear() {
    localStorage.removeItem(this.K);
    this.rolesSubject.next([]);
  }

  private get raw(): Session | null {
    try { return JSON.parse(localStorage.getItem(this.K) || 'null'); }
    catch { return null; }
  }

  get accessToken(): string | null { return this.raw?.accessToken || null; }
  get roles(): string[] { return this.raw?.roles || []; }
  get username(): string { return this.raw?.username || ''; }
  isLogged(): boolean { return !!this.accessToken; }

  isAdmin(): boolean { return this.roles.includes('ADMINISTRADOR'); }
  isUser():  boolean { return this.roles.includes('USUARIO'); }
}
