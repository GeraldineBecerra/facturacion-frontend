export interface BillingDocument {
  id: number;
  codigoTipoDocumento: number;
  tipoDocumento: string;
  clienteId: number;
  clienteRut: string;
  clienteRazonSocial: string;
  folio: number | null;
  numeroDocumento?: number | string | null;
  numeroFactura?: number | string | null;
  fechaEmision: string;
  fechaVencimiento: string | null;
  observaciones: string | null;
  moneda: string;
  tipoCambio: number;
  estado: string;
  estadoDocumento?: string | null;
  estadoSii: string | null;
  usuarioEmisorId?: number | null;
  usuarioEmisor?: string | null;
  montoNeto: number;
  montoIva: number;
  montoTotal: number;
  rutEmisor: string;
  razonSocialEmisor: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingImportDetailPreview {
  numero: number;
  codigoProducto: string | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface BillingImportPreview {
  codigoTipoDocumento: number;
  clienteId: number | null;
  clienteRazonSocial: string | null;
  clienteEncontrado: boolean;
  fechaEmision: string | null;
  fechaVencimiento: string | null;
  condicionPago: string | null;
  moneda: string;
  tipoCambio: number | null;
  observaciones: string | null;
  detalles: BillingImportDetailPreview[];
  montoNeto: number;
  montoIva: number;
  montoTotal: number;
  advertencias: string[];
}

export interface BillingDocumentDetail {
  documento: BillingDocument;
  detalles: unknown[];
  referencias: unknown[];
  guiaDespacho: unknown | null;
}

export interface BillingCreateRequest {
  codigoTipoDocumento: number;
  clienteId: number;
}

export interface BillingUpdateRequest {
  clienteId?: number;
  fechaVencimiento?: string;
  observaciones?: string;
  moneda?: string;
  tipoCambio?: number;
}

export interface BillingDetailCreateRequest {
  productoId?: number;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
}

/** Registro de un intento de envío al SII (EnvioSiiResponse del backend). */
export interface SiiEnvio {
  id: number;
  trackId: string | null;
  fechaEnvio: string | null;
  estado: string | null;
  respuesta: string | null;
  intentos: number | null;
}

/** Transición de estado SII de un documento (HistorialSiiResponse del backend). */
export interface SiiHistorial {
  estado: string | null;
  fechaEstado: string | null;
  mensaje: string | null;
}

/** Estado SII completo de un documento (EstadoSiiResponse del backend). */
export interface SiiEstado {
  documentoId: number;
  folio: number | null;
  estadoSii: string | null;
  xmlFirmado: boolean | null;
  trackId: string | null;
  envio: SiiEnvio | null;
  historial: SiiHistorial[];
}
