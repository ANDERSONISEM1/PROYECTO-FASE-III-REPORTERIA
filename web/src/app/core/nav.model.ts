export type Rol = 'ADMINISTRADOR' | 'USUARIO';

export type NavGroupKey = 'TABLERO' | 'GESTION' | 'SISTEMA';

export interface NavItem {
  label: string;
  icon?: string;
  link: string;
  exact?: boolean;
  requiredRoles?: Rol[];
  group: NavGroupKey;
  order?: number;
}

export interface NavGroup {
  key: NavGroupKey;
  title: string;
  items: NavItem[];
  order: number;
}
