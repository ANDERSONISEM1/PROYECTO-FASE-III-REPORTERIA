import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TokenStorage } from './token-storage.service';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username = ''; password = ''; loading = false; error = '';
  constructor(private store: TokenStorage, private router: Router, private auth: AuthService) { }

  loginWithGithub() {
    this.auth.loginGithub();
  }
  async submit() {
    this.loading = true; this.error = '';
    try {
      const data = await this.auth.login(this.username, this.password);
      this.store.setSession({
        accessToken: data.accessToken,
        roles: data.roles || [],
        username: data.username,
        expiresAtUtc: data.expiresAtUtc
      });

      // routing por rol
      if (this.store.isAdmin()) this.router.navigate(['/admin']);
      else if (this.store.isUser()) this.router.navigate(['/inicio']);
      else this.router.navigate(['/visor']); // fallback
    } catch (e: any) {
      this.error = e?.error || e?.message || 'No se pudo iniciar sesión';
    } finally {
      this.loading = false;
    }
  }
}