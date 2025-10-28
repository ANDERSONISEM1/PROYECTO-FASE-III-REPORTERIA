import { Injectable } from '@angular/core';
import { NavGroup, NavGroupKey, NavItem, Rol } from './nav.model';

@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly ITEMS: NavItem[] = [
    // TABLERO
    { label: 'Inicio',           icon: '🏠', link: '/inicio',  group: 'TABLERO', exact: true, order: 10, requiredRoles: ['ADMINISTRADOR','USUARIO'] },
    { label: 'Visor',            icon: '👁️', link: '/visor',   group: 'TABLERO',              order: 20, requiredRoles: ['ADMINISTRADOR','USUARIO'] },
    { label: 'Panel de Control', icon: '🎛️', link: '/control', group: 'TABLERO',              order: 30, requiredRoles: ['ADMINISTRADOR','USUARIO'] },

    // GESTIÓN (solo admin)
    { label: 'Equipos',   icon: '🛡️', link: '/admin/equipos',   group: 'GESTION', order: 10, requiredRoles: ['ADMINISTRADOR'] },
    { label: 'Jugadores', icon: '🏀', link: '/admin/jugadores',  group: 'GESTION', order: 20, requiredRoles: ['ADMINISTRADOR'] },
    { label: 'Partidos',  icon: '📅', link: '/admin/partidos',   group: 'GESTION', order: 30, requiredRoles: ['ADMINISTRADOR'] },
    { label: 'Historial', icon: '🧾', link: '/admin/historial',  group: 'GESTION', order: 40, requiredRoles: ['ADMINISTRADOR'] },

    // SISTEMA (solo admin)
    { label: 'Reportería', icon: '📑', link: '/admin/reporteria',        group: 'SISTEMA', order: 20, requiredRoles: ['ADMINISTRADOR'] }, // ← NUEVO
    { label: 'Ajustes',   icon: '⚙️', link: '/admin/ajustes',    group: 'SISTEMA', order: 10, requiredRoles: ['ADMINISTRADOR'] },
     
  ];

  private readonly GROUP_META: Record<NavGroupKey, { title: string; order: number }> = {
    TABLERO: { title: 'TABLERO', order: 10 },
    GESTION: { title: 'GESTIÓN', order: 20 },
    SISTEMA: { title: 'SISTEMA', order: 30 },
  };

  getGroupsFor(roles: Rol[]): NavGroup[] {
    const can = (item: NavItem) =>
      !item.requiredRoles || item.requiredRoles.some(r => roles.includes(r));

    const visibles = this.ITEMS.filter(can).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const groupsMap = new Map<NavGroupKey, NavGroup>();
    for (const it of visibles) {
      if (!groupsMap.has(it.group)) {
        const meta = this.GROUP_META[it.group];
        groupsMap.set(it.group, { key: it.group, title: meta.title, order: meta.order, items: [] });
      }
      groupsMap.get(it.group)!.items.push(it);
    }

    return Array.from(groupsMap.values()).sort((a, b) => a.order - b.order);
  }
}
