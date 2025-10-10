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
  template: `
  <div class="login-wrap">
    <aside class="card">
      <div class="header"><h3>Bienvenido</h3></div>
      <form (ngSubmit)="submit()" #f="ngForm" class="form">
        <label class="field"><span>Usuario</span>
          <input type="text" [(ngModel)]="username" name="username" required />
        </label>
        <label class="field"><span>Contraseña</span>
          <input type="password" [(ngModel)]="password" name="password" required />
        </label>
        <button class="btn primary" [disabled]="f.invalid || loading">
          {{ loading ? 'Ingresando…' : 'Iniciar sesión' }}
        </button>
        <p class="note" *ngIf="error">{{error}}</p>
      </form>
    </aside>
  </div>
  `,
  styles: [`
    /* Pantalla completa y centrado */
    .login-wrap{
      min-height:100dvh;
      display:flex; align-items:center; justify-content:center;
      background:#0a192f; /* azul oscuro profesional */
      color:#eaeaea; padding:24px;
      font-family: 'Segoe UI', Roboto, sans-serif;
    }

    /* Tarjeta */
    .card{
      width: min(500px, 92vw);
      background:#112240;
      border:1px solid #1f3b66;
      border-radius:16px;
      box-shadow:0 6px 22px rgba(0,0,0,.55);
      overflow:hidden;
      animation: fadeIn .6s ease-out;
    }

    /* Header */
    .header{
      padding:24px 26px;
      border-bottom:1px solid #ffffffff;
      background:linear-gradient(180deg,#1d3557,#112240);
      display:flex; align-items:center; justify-content:center;
    }
    .header h3{ margin:0; font-size:24px; font-weight:700; color:#f0f4ff; text-align:center; width:100%; }

    /* Formulario */
    .form{ padding:26px 28px 30px; }
    .field{ display:block; }
    .field + .field{ margin-top:16px; }
    .field span{ display:block; margin-bottom:6px; font-size:14px; color:#a9c1de; font-weight:500; }
    .field input{
      width:100%; padding:14px 12px; font-size:15px;
      background:#0d1b2a; color:#f0f4ff;
      border:1px solid #1f3b66; border-radius:10px;
      transition:border-color .18s, background .18s;
    }
    .field input:focus{ outline:none; border-color:#3a86ff; background:#152a45; }

    /* Botón */
    .btn.primary{
      width:100%; margin-top:20px; padding:14px 12px;
      border:none; border-radius:10px;
      background:#3a86ff; color:#fff;
      font-weight:700; font-size:16px; letter-spacing:.3px;
      cursor:pointer; transition:background .2s, transform .06s ease;
    }
    .btn.primary:hover{ background:#2f6fd4; }
    .btn.primary:active{ transform:translateY(1px); }
    .btn.primary[disabled]{ opacity:.65; cursor:not-allowed; }

    /* Nota error */
    .note{ color:#ff7676; margin:14px 2px 0; font-size:13px; text-align:center; }

    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

    @media (max-width: 420px){
      .header{ padding:18px 16px; }
      .form{ padding:20px 16px 24px; }
    }
  `]
})
export class LoginComponent {
  username = ''; password = ''; loading = false; error = '';
  constructor(private store: TokenStorage, private router: Router, private auth: AuthService) {}

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
      if (this.store.isAdmin())      this.router.navigate(['/admin']);
      else if (this.store.isUser())  this.router.navigate(['/inicio']);
      else                           this.router.navigate(['/visor']); // fallback
    } catch (e: any) {
      this.error = e?.error || e?.message || 'No se pudo iniciar sesión';
    } finally {
      this.loading = false;
    }
  }
}