// web/src/app/Auth/oauth-google.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, LoginResponse } from './auth.service';
import { TokenStorage } from './token-storage.service';

@Component({ standalone: true, template: 'Procesando login con Google…' })
export class OauthGoogleComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private auth: AuthService,
        private storage: TokenStorage
    ) { }

    async ngOnInit(): Promise<void> {
        const code = this.route.snapshot.queryParamMap.get('code');
        const state = this.route.snapshot.queryParamMap.get('state');

        if (!code || !state) {
            await this.router.navigateByUrl('/login');
            return;
        }

        try {
            const resp: LoginResponse = await this.auth.exchangeGoogleCode(code, state);
            this.storage.setSession({
                accessToken: resp.accessToken,
                roles: resp.roles,
                username: resp.username,
                expiresAtUtc: resp.expiresAtUtc
            });

            // Routing según rol
            if (this.storage.isAdmin()) {
                await this.router.navigate(['/admin']);
            } else if (this.storage.isUser()) {
                await this.router.navigate(['/inicio']);
            } else {
                await this.router.navigate(['/visor']);
            }
        } catch (err) {
            console.error('Error en login Google:', err);
            await this.router.navigateByUrl('/login');
        }
    }
}
