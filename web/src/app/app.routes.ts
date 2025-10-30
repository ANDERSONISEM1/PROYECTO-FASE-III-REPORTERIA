import { Routes } from '@angular/router';
import { VisorComponent } from './pages/visor/visor.component';
import { ControlComponent } from './pages/control/control.component';
import { LoginComponent } from './Auth/login.component';
import { AdminLayoutComponent } from './admin/admin-layout.component';
import { authGuard } from './Auth/auth.guard';
import { roleGuard } from './Auth/role.guard';
import { EquiposComponent } from './pages/equipos/equipos.component';
import { JugadoresComponent } from './pages/jugadores/jugadores.component';
import { PartidosComponent } from './pages/partidos/partidos.component';
import { HistorialComponent } from './pages/historial/historial.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { AjustesComponent } from './pages/ajustes/ajustes.component';
import { ReporteriaComponent } from './pages/Reporteria/reporteria.component';
import { OauthGithubComponent } from './Auth/oauth-github.component';
import { OauthGoogleComponent } from './Auth/oauth-google.component';


export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'oauth/github', component: OauthGithubComponent },
  { path: 'oauth/google', component: OauthGoogleComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  // Layout (ambos roles ven Inicio en layout)
  {
    path: '',
    canActivate: [authGuard],
    component: AdminLayoutComponent,
    children: [
      { path: 'inicio', canMatch: [roleGuard(['ADMINISTRADOR', 'USUARIO'])], component: InicioComponent },
    ]
  },

  // Pantallas sueltas
  { path: 'control', canActivate: [authGuard], canMatch: [roleGuard(['ADMINISTRADOR', 'USUARIO'])], component: ControlComponent },
  { path: 'visor', canActivate: [authGuard], canMatch: [roleGuard(['ADMINISTRADOR', 'USUARIO'])], component: VisorComponent },

  // Grupo admin bajo layout (gestión)
  {
    path: 'admin',
    canActivate: [authGuard],
    canMatch: [roleGuard(['ADMINISTRADOR'])],
    component: AdminLayoutComponent,
    children: [
      { path: '', component: InicioComponent }
    ]
  },
  {
    path: 'admin/equipos',
    canActivate: [authGuard],
    canMatch: [roleGuard(['ADMINISTRADOR'])], // si luego quieres habilitar USUARIO, cambia acá y en NavService
    component: AdminLayoutComponent,
    children: [
      { path: '', component: EquiposComponent }
    ]
  },
  {
    path: 'admin/jugadores',
    canActivate: [authGuard],
    canMatch: [roleGuard(['ADMINISTRADOR'])],
    component: AdminLayoutComponent,
    children: [
      { path: '', component: JugadoresComponent }
    ]
  },
  {
    path: 'admin/partidos',
    canActivate: [authGuard],
    canMatch: [roleGuard(['ADMINISTRADOR', 'USUARIO'])], // ejemplo habilitado a ambos
    component: AdminLayoutComponent,
    children: [
      { path: '', component: PartidosComponent }
    ]
  },
  {
    path: 'admin/historial',
    canActivate: [authGuard],
    canMatch: [roleGuard(['ADMINISTRADOR'])],
    component: AdminLayoutComponent,
    children: [
      { path: '', component: HistorialComponent }
    ]
  },
  {
    path: 'admin/reporteria',
    canActivate: [authGuard],
    canMatch: [roleGuard(['ADMINISTRADOR'])],
    component: AdminLayoutComponent,
    children: [
      { path: '', component: ReporteriaComponent }
    ]
  },

  {
    path: 'admin/ajustes',
    canActivate: [authGuard],
    canMatch: [roleGuard(['ADMINISTRADOR'])],
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AjustesComponent }
    ]
  },



  { path: '**', redirectTo: 'login' }
];