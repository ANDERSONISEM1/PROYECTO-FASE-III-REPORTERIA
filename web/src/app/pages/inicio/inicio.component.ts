import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type Estado = 'programado'|'en_curso'|'finalizado'|'cancelado'|'suspendido';

type Equipo  = { id: number; nombre: string };
type Partido = {
  id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  fecha_hora_inicio: string; // ISO
  sede: string;
  estado: Estado;
};

// Servicios
import { InicioService } from './inicio.service';
import { NavService } from '../../core/nav.service';
import { TokenStorage } from '../../Auth/token-storage.service';

@Component({
  standalone: true,
  selector: 'app-inicio',
  imports: [CommonModule, RouterLink],
  template: `
  <div class="inicio-container">

    <!-- ===== KPIs ===== -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Equipos</div>
        <div class="kpi-value">{{ totalEquipos }}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">Jugadores</div>
        <div class="kpi-value">{{ totalJugadores }}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">Partidos (Programados)</div>
        <div class="kpi-value">{{ partidosPendientes }}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-title">Próximo partido</div>
        <div class="kpi-next" *ngIf="proximoPartido; else noNext">
          <div class="kpi-next-match">
            {{ nombreEquipo(proximoPartido.equipo_local_id) }} vs
            {{ nombreEquipo(proximoPartido.equipo_visitante_id) }}
          </div>
          <div class="kpi-next-date">
            {{ formatFecha(proximoPartido.fecha_hora_inicio) }} — {{ proximoPartido.sede || '—' }}
          </div>
        </div>
        <ng-template #noNext><div class="kpi-value">—</div></ng-template>
      </div>
    </div>

    <!-- ===== Accesos rápidos ===== -->
    <div class="atajos-card">
      <div class="atajos-header">Atajos</div>
      <div class="atajos-actions">
        <!-- OJO: ahora apuntan a /admin/... y se muestran solo si el rol tiene permiso -->
        <a *ngIf="can('/admin/equipos')" class="btn-xl primary" routerLink="/admin/equipos">
          <span class="ico">➕</span> Crear Equipo
        </a>
        <a *ngIf="can('/admin/jugadores')" class="btn-xl" routerLink="/admin/jugadores">
          Registrar Jugadores
        </a>
        <a *ngIf="can('/admin/partidos')" class="btn-xl" routerLink="/admin/partidos">
          Nuevo Partido
        </a>
        <a *ngIf="can('/admin/historial')" class="btn-xl" routerLink="/admin/historial">
          Historial
        </a>
      </div>
      <div class="atajos-foot">
        Este tablero resume el estado y ofrece accesos rápidos. (RNF-ADM-03)
      </div>
    </div>

  </div>
  `,
  styleUrls: ['../../../styles-faseII.scss']
})
export class InicioComponent {

  // Para mostrar nombres en “Próximo partido”
  equipos:  Equipo[] = [];

  // KPIs (respaldos internos)
  private kpiEquipos = 0;
  private kpiJugadores = 0;
  private kpiPendientes = 0;

  // Próximo partido desde backend (o null)
  nextMatch: Partido | null = null;

  constructor(
    private service: InicioService,
    private nav: NavService,
    private store: TokenStorage
  ) {
    this.init();
  }

  // ====== Helper para controlar visibilidad de atajos por rol/permiso ======
  can(link: string): boolean {
    const roles = this.store.roles;
    const items = this.nav.getGroupsFor(roles as any).flatMap(g => g.items);
    return items.some(it => it.link === link);
  }

  // ====== Carga inicial ======
  private init() {
    // 1) Equipos (para nombres de los badges)
    this.service.getEquipos().subscribe({
      next: rows => this.equipos = rows,
      error: () => this.equipos = []
    });

    // 2) KPIs
    this.service.getKpis().subscribe({
      next: k => {
        this.kpiEquipos = k.totalEquipos;
        this.kpiJugadores = k.totalJugadores;
        this.kpiPendientes = k.partidosPendientes;
      },
      error: () => {
        this.kpiEquipos = 0;
        this.kpiJugadores = 0;
        this.kpiPendientes = 0;
      }
    });

    // 3) Próximo partido
    this.service.getProximo().subscribe({
      next: p => this.nextMatch = p ? {
        id: p.id,
        equipo_local_id: p.equipo_local_id,
        equipo_visitante_id: p.equipo_visitante_id,
        fecha_hora_inicio: p.fecha_hora_inicio,
        sede: p.sede,
        estado: p.estado
      } : null,
      error: () => this.nextMatch = null
    });
  }

  // ===== KPIs calculados (getters conservan nombres del template) =====
  get totalEquipos()       { return this.kpiEquipos; }
  get totalJugadores()     { return this.kpiJugadores; }
  get partidosPendientes() { return this.kpiPendientes; }

  get proximoPartido(): Partido | null {
    return this.nextMatch;
  }

  // ===== Helpers visuales =====
  nombreEquipo(id: number) { return this.equipos.find(e=>e.id===id)?.nombre ?? '—'; }
  formatFecha(iso: string) { return iso ? new Date(iso).toLocaleString() : '—'; }
}
