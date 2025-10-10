// ===== Modelo que usa el componente (UI) =====
export interface Team {
  id: number;
  nombre: string;
  ciudad: string;
  abreviatura: string;
  activo: boolean;
  fecha_creacion: string;   // ISO yyyy-MM-dd
  logo?: string;            // DataURL o URL del API para <img>
}

export type TeamUpdate = Partial<Pick<Team, 'nombre' | 'ciudad' | 'abreviatura' | 'activo' | 'logo'>>;

// ===== DTOs que devuelve/recibe el backend =====
export interface EquipoDto {
  id: number;
  nombre: string;
  ciudad?: string | null;
  abreviatura?: string | null;
  activo: boolean;
  fechaCreacion: string;   // ISO completa (DateTime)
  logoUrl?: string | null; // puede venir null; igual usamos /{id}/logo
}

export interface CreateEquipoRequest {
  nombre: string;
  ciudad?: string;
  abreviatura?: string;
  activo: boolean;
  fechaCreacion?: string | null; // ISO
  logoBase64?: string | null;    // DataURL o solo base64
}

export interface UpdateEquipoRequest {
  nombre: string;
  ciudad?: string;
  abreviatura?: string;
  activo: boolean;
  // null = no tocar; "" = borrar; valor = reemplazar
  logoBase64: string | null;
}
