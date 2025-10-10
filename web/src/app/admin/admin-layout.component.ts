import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, interval, switchMap } from 'rxjs';
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
    <aside class="admin-side">
      <div class="admin-side-inner">
        <div class="admin-brand">
          <div class="admin-logo">MB</div>
          <div class="admin-brand-title hide-md"><h1>Marcador Basket – Admin</h1></div>
        </div>

        <ng-container *ngFor="let g of groups">
          <div class="group">
            <div class="admin-group-title">{{ g.title }}</div>
            <nav class="admin-nav">
              <a *ngFor="let it of g.items"
                 class="admin-item"
                 [routerLink]="it.link"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{ exact: it.exact === true }">
                <span class="admin-ico">{{ it.icon || '•' }}</span>
                <span class="hide-md">{{ it.label }}</span>
              </a>
            </nav>
          </div>
        </ng-container>

        <button class="logout-btn" (click)="logout()">
          <span class="admin-ico">🚪</span><span class="hide-md">Salir</span>
        </button>
      </div>
    </aside>

    <section class="admin-main">
      <router-outlet></router-outlet>
    </section>
  </div>
  `
})
export class AdminLayoutComponent implements OnDestroy {
  groups: NavGroup[] = [];
  private sub?: Subscription;
  private syncSub?: Subscription;

  constructor(
    private store: TokenStorage,
    private nav: NavService,
    private auth: AuthService,
    private router: Router
  ) {
    // 1) Construye menú y manténlo reactivo a cambios locales de roles
    this.sub = this.store.roles$.subscribe(roles => {
      this.groups = this.nav.getGroupsFor(roles as any);
    });
    // construye con estado actual (por si ya había sesión)
    this.groups = this.nav.getGroupsFor(this.store.roles as any);

    // 2) Auto-refresco (30s) para capturar cambios de roles en servidor
    this.syncSub = interval(30000)
      .pipe(switchMap(() => this.auth.getMe()))
      .subscribe({
        next: me => this.store.updateRoles(me.roles || []),
        error: () => { /* silenciar si falla */ }
      });
  }

  logout() {
    this.store.clear();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.syncSub?.unsubscribe();
  }
}
