export interface DocumentType {
  id: number;
  codigoSii: number;
  descripcion: string;
}

export interface CafRequest {
  codigoTipoDocumento: number | null;
  rangoDesde: number | null;
  rangoHasta: number | null;
  fechaAutorizacion: string;
  fechaVencimiento: string | null;
  cafXml: string;
}

export interface CafResponse {
  id: number;
  codigoTipoDocumento: number;
  tipoDocumento: string;
  rangoDesde: number;
  rangoHasta: number;
  fechaAutorizacion: string;
  fechaVencimiento: string | null;
  estado: string;
  foliosGenerados: number;
  foliosDisponibles: number;
}

export interface FolioControl {
  id: number;
  cafActivoId: number | null;
  codigoTipoDocumento: number;
  tipoDocumento: string;
  rangoDesde: number | null;
  rangoHasta: number | null;
  ultimoFolioUtilizado: number | null;
  estadoCaf: string | null;
}
