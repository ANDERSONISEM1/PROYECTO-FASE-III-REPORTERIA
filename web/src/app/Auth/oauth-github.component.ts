import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, LoginResponse } from './auth.service';
import { TokenStorage } from './token-storage.service';

@Component({
  standalone: true,
  template: `
    <div class="oauth-loader-backdrop" role="status" aria-live="polite">
      <div class="oauth-loader-card">
        <svg class="ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stop-color="#66e0ff" />
              <stop offset="40%" stop-color="#19a9d9" />
              <stop offset="100%" stop-color="#0b6b8f" />
            </linearGradient>
          </defs>

          <circle class="ring-bg" cx="60" cy="60" r="44" />
          <circle class="ring-stroke" cx="60" cy="60" r="44" stroke="url(#g1)" />
        </svg>

        <div class="loader-text">
          <div class="title">Procesando login</div>
          <div class="provider">con GitHub…</div>
        </div>
      </div>
    </div>
  `,
 styleUrls: ['./login.component.css']

})
export class OauthGithubComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private storage: TokenStorage
  ) {}

  async ngOnInit(): Promise<void> {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');

    if (!code || !state) {
      await this.router.navigateByUrl('/login');
      return;
    }

    try {
      const resp: LoginResponse = await this.auth.exchangeGithubCode(code, state);
      this.storage.setSession({
        accessToken: resp.accessToken,
        roles: resp.roles,
        username: resp.username,
        expiresAtUtc: resp.expiresAtUtc
      });

      if (this.storage.isAdmin()) {
        await this.router.navigate(['/admin']);
      } else if (this.storage.isUser()) {
        await this.router.navigate(['/inicio']);
      } else {
        await this.router.navigate(['/visor']);
      }
    } catch {
      await this.router.navigateByUrl('/login');
    }
  }
}
