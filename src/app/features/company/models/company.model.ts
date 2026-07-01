export interface CompanyRequest {
  rutEmpresa: string;
  razonSocial: string;
  nombreFantasia: string;
  giro: string;
  direccion: string;
  ciudad: string;
  comuna: string;
  pais: string;
  telefono: string;
  sitioWeb: string;
  emailPrincipal: string;
  emailContabilidad: string;
  rutRepresentante: string;
  nombreRepresentante: string;
  telefonoRepresentante: string;
}

export interface CompanyResponse extends CompanyRequest {
  id: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CompanyFormModel extends CompanyRequest {
  activo: boolean;
}
