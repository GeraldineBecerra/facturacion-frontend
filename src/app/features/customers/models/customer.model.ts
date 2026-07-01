export interface CustomerRequest {
  rut: string;
  razonSocial: string;
  nombreFantasia: string;
  giro: string;
  direccion: string;
  ciudad: string;
  comuna: string;
  region: string;
  pais: string;
  telefono: string;
  email: string;
}

export interface CustomerResponse extends CustomerRequest {
  id: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
