import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { TokenStorage } from '../Auth/token-storage.service';
import { NavService } from '../core/nav.service';
import { NavGroup } from '../core/nav.model';
import { AuthService } from '../Auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
<div class="admin-bg"></div>
<div class="admin-shell">
  <!-- === SIDEBAR === -->
  <aside class="admin-side">
    <div class="admin-side-inner">
      <div class="admin-brand">
        <!-- Bloque de bienvenida (centrado, nombre debajo) -->
        <div class="welcome-block hide-md" *ngIf="displayName">
          <div class="welcome-title">BIENVENIDO</div>
          <div class="welcome-name">
            <span class="welcome-ico">👤</span>
            <span class="welcome-text">{{ displayName }}</span>
          </div>
        </div>
      </div>

      <!-- Menú por grupos -->
      <ng-container *ngFor="let g of groups">
        <div class="group">
          <div class="admin-group-title">{{ g.title }}</div>
          <nav class="admin-nav">
            <a
              *ngFor="let it of g.items"
              class="admin-item"
              [routerLink]="it.link"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: it.exact === true }"
            >
              <span class="admin-ico">{{ it.icon || '•' }}</span>
              <span class="hide-md">{{ it.label }}</span>
            </a>
          </nav>
        </div>
      </ng-container>

      <button class="logout-btn" (click)="logout()">
        <span class="admin-ico">🚪</span>
        <span class="hide-md">Salir</span>
      </button>
    </div> <!-- /admin-side-inner -->
  </aside> <!-- /admin-side -->

  <!-- === MAIN === -->
  <section class="admin-main">
    <router-outlet></router-outlet>
  </section>
</div> <!-- /admin-shell -->


  `
})
export class AdminLayoutComponent implements OnDestroy {
  groups: NavGroup[] = [];
  displayName: string | null = null;

  private sub?: Subscription;

  constructor(
    private store: TokenStorage,
    private nav: NavService,
    private auth: AuthService,
    private router: Router
  ) {
    // Menú reactivo por roles
    this.sub = this.store.roles$.subscribe(roles => {
      this.groups = this.nav.getGroupsFor(roles as any);
    });
    this.groups = this.nav.getGroupsFor(this.store.roles as any);

    // Nombre bonito para cabecera (preferir JWT.name)
    this.displayName = this.resolveDisplayName();
  }

  logout() {
    this.store.clear();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // =======================
  // Helpers de presentación
  // =======================
  private resolveDisplayName(): string | null {
    // 1) Intentar sacar `name` del JWT (tu backend lo firma con name = user.nombre)
    const token = this.getAccessTokenFromStore();
    const jwtName = this.getNameFromJwt(token);
    if (jwtName) return jwtName;

    // 2) Fallback: derivar algo legible del `username` si es un correo
    const u = (this.store as any)?.username as string | null | undefined;
    if (u && u.includes('@')) {
      const local = u.split('@')[0];                 // ej: "jose.salazar" o "jsalazar"
      const parts = local.split(/[._-]+/g);          // separa por puntos/guiones/guion bajo
      if (parts.length >= 2) {
        // Capitaliza cada parte -> "Jose Salazar"
        return parts.map(this.cap).join(' ');
      } else {
        // Solo una parte -> capitaliza primera letra -> "Jsalazar"
        return this.cap(local);
      }
    }
    // 3) Si no hay correo o no aplica, usa username tal cual (si no luce como correo)
    if (u && !u.includes('@')) return this.capWords(u);
    return null;
  }

  private getAccessTokenFromStore(): string | null {
    // Soporta distintas implementaciones de TokenStorage
    const anyStore = this.store as any;
    return anyStore.accessToken
        ?? anyStore.getAccessToken?.()
        ?? anyStore.token
        ?? null;
  }

  private getNameFromJwt(token: string | null): string | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const payloadRaw = this.base64UrlDecode(parts[1]);
      const payload = JSON.parse(payloadRaw);
      // Tu backend incluye `name` (y a veces `nombre`), por si acaso
      const name = payload?.name || payload?.nombre;
      if (typeof name === 'string' && name.trim().length > 0) {
        return name.trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  private base64UrlDecode(b64url: string): string {
    // Base64URL -> Base64
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    // atob -> string
    return atob(b64);
  }

  private cap(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private capWords(s: string): string {
    return s
      .split(/\s+/g)
      .map(this.cap)
      .join(' ');
  }
}
