export interface AuditRecord {
  id: number;
  tabla: string;
  accion: string;
  usuarioId: number | null;
  fecha: string;
  detalle: string | null;
}
