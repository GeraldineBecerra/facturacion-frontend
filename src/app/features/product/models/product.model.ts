export interface ProductResponse {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string | null;
  precio: number;
  afectaIva: boolean;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRequest {
  codigo: string;
  nombre: string;
  descripcion: string;
  unidadMedida: string;
  precio: number;
  afectaIva: boolean;
  activo: boolean;
}
