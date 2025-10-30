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
  loginWithGoogle() {
    this.auth.loginGoogle();
  }
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
      this.error = this.readableHttpError(e);
    } finally {
      this.loading = false;
    }
  }
  private readableHttpError(err: any): string {
    // Backend que responde { error: "mensaje" }
    if (err?.error?.error && typeof err.error.error === 'string') {
      return err.error.error;
    }
    // Backend que responde string plano
    if (typeof err?.error === 'string') {
      return err.error;
    }
    // Errores de validación (ej. Zod) en details
    if (Array.isArray(err?.error?.details) && err.error.details.length) {
      // toma el primer mensaje legible
      const first = err.error.details[0];
      return first?.message || 'Datos inválidos';
    }
    // Error de red / CORS / servidor caído
    if (err?.status === 0 || err?.name === 'HttpErrorResponse' && !err?.status) {
      return 'No se pudo conectar al servidor. Verifica tu conexión.';
    }
    // Mensaje HTTP genérico
    if (err?.message && typeof err.message === 'string') {
      return err.message;
    }
    return 'Ocurrió un error inesperado al iniciar sesión.';
  }
}