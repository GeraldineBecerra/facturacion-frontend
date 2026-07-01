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
