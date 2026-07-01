export interface Role {
  id: number;
  nombre: string;
  nombreMostrar: string;
  descripcion: string | null;
  activo: boolean;
  canDelete?: boolean;
}

export interface RoleRequest {
  nombre: string;
  nombreMostrar: string;
  descripcion: string;
}
