import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { DynamicTableComponent, TableAction, TableColumn } from '../../../../shared/components/table/table';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { BillingDocument, SiiEstado } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicTableComponent, PageHeaderComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './billing-list.html',
  styleUrl: './billing-list.scss',
})
export class BillingList implements OnInit {
  filters = { folio: '', rutEmisor: '', razonSocial: '', estado: '' };
  documents: BillingDocument[] = [];
  filteredDocuments: BillingDocument[] = [];
  isLoading = false;
  error: string | null = null;
  siiMessage: string | null = null;
  siiMessageType: 'success' | 'error' = 'success';

  columns: TableColumn[] = [
    {
      key: 'folio',
      label: 'N° factura',
      sortable: true,
      formatter: (_value, document: BillingDocument) => this.getInvoiceNumber(document),
    },
    { key: 'tipoDocumento', label: 'Tipo DTE' },
    { key: 'fechaEmision', label: 'Emisión', type: 'date' },
    {
      key: 'usuarioEmisor',
      label: 'Emitido por',
      formatter: (value, document: BillingDocument) =>
        value || (this.getDocumentStatus(document) === 'BORRADOR' ? 'Sin emitir' : 'No registrado'),
    },
    { key: 'clienteRazonSocial', label: 'Cliente', type: 'avatar', avatarKey: 'clienteRut' },
    {
      key: 'montoTotal',
      label: 'Total',
      formatter: (value) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value ?? 0),
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      formatter: (_value, document: BillingDocument) => this.getDocumentStatus(document),
      badgeColors: {
        BORRADOR: 'bg-amber-100 text-amber-800',
        EMITIDO: 'bg-emerald-100 text-emerald-800',
        ACEPTADO: 'bg-emerald-100 text-emerald-800',
        ANULADO: 'bg-red-100 text-red-800',
        RECHAZADO: 'bg-red-100 text-red-800',
      },
    },
    {
      key: 'estadoSii',
      label: 'Estado SII',
      type: 'badge',
      formatter: (_value, document: BillingDocument) => this.getSiiStatus(document),
      badgeColors: {
        PENDIENTE: 'bg-slate-100 text-slate-700',
        ENVIADO: 'bg-blue-100 text-blue-800',
        RECIBIDO: 'bg-blue-100 text-blue-800',
        ACEPTADO: 'bg-emerald-100 text-emerald-800',
        RECHAZADO: 'bg-red-100 text-red-800',
        ERROR: 'bg-red-100 text-red-800',
      },
    },
  ];

  actions: TableAction[] = [
    // {
    //   type: 'custom',
    //   label: 'Ver documento',
    //   icon: 'view',
    //   clickFn: (document) => this.viewDocument(document),
    //   colorClass: 'text-blue-600 hover:bg-blue-50',
    // },
    {
      type: 'custom',
      label: 'Enviar al SII',
      icon: 'send',
      clickFn: (document) => this.enviarSii(document),
      colorClass: 'text-indigo-600 hover:bg-indigo-50',
      visibleFn: (document) => this.canEnviarSii(document),
    },
    {
      type: 'custom',
      label: 'Actualizar estado SII',
      icon: 'sync',
      clickFn: (document) => this.actualizarSii(document),
      colorClass: 'text-blue-600 hover:bg-blue-50',
      visibleFn: (document) => this.canActualizarSii(document),
    },
    {
      type: 'custom',
      label: 'Descargar PDF',
      icon: 'picture-as-pdf',
      clickFn: (document) => this.downloadPdf(document),
      colorClass: 'text-red-600 hover:bg-red-50',
    },
    // {
    //   type: 'custom',
    //   label: 'Descargar TXT',
    //   icon: 'file-text',
    //   clickFn: (document) => this.downloadTxt(document),
    //   colorClass: 'text-slate-600 hover:bg-slate-100',
    // },
  ];

  constructor(private router: Router, private billingService: BillingService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  get receivedTotal(): number {
    return this.documents.reduce((total, document) => total + Number(document.montoTotal ?? 0), 0);
  }

  get acceptedDocuments(): number {
    return this.documents.filter((document) => this.getDocumentStatus(document) === 'EMITIDO').length;
  }

  get pendingDocuments(): number {
    return this.documents.filter((document) => this.getDocumentStatus(document) === 'BORRADOR').length;
  }

  get monthlySummary(): { label: string; total: number; value: number }[] {
    const now = new Date();
    const months = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1);
      const total = this.documents
        .filter((document) => this.isInMonth(document.fechaEmision, date))
        .reduce((sum, document) => sum + Number(document.montoTotal ?? 0), 0);
      return {
        label: new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(date).replace('.', ''),
        total,
        value: 0,
      };
    });
    const maximum = Math.max(...months.map((month) => month.total), 0);
    return months.map((month) => ({
      ...month,
      value: maximum ? Math.max(month.total ? 5 : 0, Math.round((month.total / maximum) * 100)) : 0,
    }));
  }

  get periodComparison(): string {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentTotal = this.totalForMonth(currentMonth);
    const previousTotal = this.totalForMonth(previousMonth);
    if (!previousTotal) {
      return currentTotal
        ? 'Sin facturación registrada en el mes anterior'
        : 'Sin movimientos en el mes actual';
    }
    const variation = ((currentTotal - previousTotal) / previousTotal) * 100;
    const sign = variation > 0 ? '+' : '';
    return `${sign}${variation.toLocaleString('es-CL', { maximumFractionDigits: 1 })}% respecto al mes anterior`;
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.error = null;
    this.billingService.findAll().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (documents) => {
        this.documents = documents;
        this.search();
      },
      error: () => this.error = 'No fue posible cargar los documentos tributarios.',
    });
  }

  createBilling(): void {
    this.router.navigate(['/facturacion/nueva']);
  }

  search(): void {
    const folio = this.filters.folio.trim().toLowerCase();
    const rut = this.filters.rutEmisor.trim().toLowerCase();
    const razonSocial = this.filters.razonSocial.trim().toLowerCase();
    this.filteredDocuments = this.documents.filter((document) =>
      (!folio || String(this.getInvoiceNumber(document)).toLowerCase().includes(folio)) &&
      (!rut || (document.rutEmisor ?? '').toLowerCase().includes(rut)) &&
      (!razonSocial || (document.clienteRazonSocial ?? '').toLowerCase().includes(razonSocial)) &&
      (!this.filters.estado || this.getDocumentStatus(document) === this.filters.estado)
    );
  }

  clearFilters(): void {
    this.filters = { folio: '', rutEmisor: '', razonSocial: '', estado: '' };
    this.search();
  }

  viewDocument(document: BillingDocument): void {
    this.router.navigate(['/facturacion', document.id]);
  }

  downloadPdf(document: BillingDocument): void {
    this.billingService.downloadPdf(document.id).subscribe({
      next: (blob) => this.saveBlob(blob, `documento-${document.id}.pdf`),
      error: () => this.error = 'No fue posible descargar el PDF del documento.',
    });
  }

  downloadTxt(document: BillingDocument): void {
    this.billingService.downloadTxt(document.id).subscribe({
      next: (blob) => this.saveBlob(blob, `documento-${document.id}.txt`),
      error: () => this.error = 'No fue posible descargar el TXT del documento.',
    });
  }

  getInvoiceNumber(document: BillingDocument): string {
    return String(document.folio ?? document.numeroDocumento ?? document.numeroFactura ?? 'Sin folio');
  }

  getDocumentStatus(document: BillingDocument): string {
    const status = document.estadoDocumento ?? document.estado ?? document.estadoSii ?? 'BORRADOR';
    return status.toUpperCase();
  }

  // --------------------------------------------------------------- SII

  getSiiStatus(document: BillingDocument): string {
    return (document.estadoSii ?? 'PENDIENTE').toUpperCase();
  }

  /** Solo documentos emitidos y aún no aceptados pueden (re)enviarse. */
  canEnviarSii(document: BillingDocument): boolean {
    return this.getDocumentStatus(document) !== 'BORRADOR'
      && ['PENDIENTE', 'RECHAZADO', 'ERROR'].includes(this.getSiiStatus(document));
  }

  /** Mientras el SII no resuelve, se puede consultar el estado del envío. */
  canActualizarSii(document: BillingDocument): boolean {
    return ['ENVIADO', 'RECIBIDO'].includes(this.getSiiStatus(document));
  }

  enviarSii(document: BillingDocument): void {
    this.billingService.enviarSii(document.id).subscribe({
      next: (estado) => {
        this.applySiiEstado(document, estado);
        this.setSiiMessage(
          `Documento enviado al SII. Track ID ${estado.trackId ?? '—'} · estado ${estado.estadoSii}.`,
          'success',
        );
      },
      error: (err) => this.setSiiMessage(
        this.extractSiiError(err, 'No fue posible enviar el documento al SII.'), 'error'),
    });
  }

  actualizarSii(document: BillingDocument): void {
    this.billingService.consultarSii(document.id).subscribe({
      next: (estado) => {
        this.applySiiEstado(document, estado);
        const rechazado = estado.estadoSii === 'RECHAZADO';
        const detalle = estado.envio?.respuesta ? ` ${estado.envio.respuesta}` : '';
        this.setSiiMessage(`Estado SII actualizado: ${estado.estadoSii}.${detalle}`,
          rechazado ? 'error' : 'success');
      },
      error: (err) => this.setSiiMessage(
        this.extractSiiError(err, 'No fue posible consultar el estado en el SII.'), 'error'),
    });
  }

  get siiAceptados(): number {
    return this.documents.filter((d) => (d.estadoSii ?? '').toUpperCase() === 'ACEPTADO').length;
  }

  get siiEnProceso(): number {
    return this.documents.filter((d) => ['ENVIADO', 'RECIBIDO'].includes((d.estadoSii ?? '').toUpperCase())).length;
  }

  get siiRechazados(): number {
    return this.documents.filter((d) => ['RECHAZADO', 'ERROR'].includes((d.estadoSii ?? '').toUpperCase())).length;
  }

  get siiGestionados(): number {
    return this.siiAceptados + this.siiEnProceso + this.siiRechazados;
  }

  get siiAceptadosPct(): number {
    return this.documents.length ? Math.round((this.siiAceptados / this.documents.length) * 100) : 0;
  }

  private applySiiEstado(document: BillingDocument, estado: SiiEstado): void {
    document.estadoSii = estado.estadoSii;
    if (estado.folio != null) document.folio = estado.folio;
    this.search();
  }

  private setSiiMessage(message: string, type: 'success' | 'error'): void {
    this.siiMessage = message;
    this.siiMessageType = type;
  }

  private extractSiiError(err: unknown, fallback: string): string {
    return (err as { error?: { mensaje?: string } })?.error?.mensaje ?? fallback;
  }

  private totalForMonth(month: Date): number {
    return this.documents
      .filter((document) => this.isInMonth(document.fechaEmision, month))
      .reduce((sum, document) => sum + Number(document.montoTotal ?? 0), 0);
  }

  private isInMonth(dateValue: string, month: Date): boolean {
    if (!dateValue) return false;
    const parts = dateValue.slice(0, 10).split('-').map(Number);
    if (parts.length < 2 || !parts[0] || !parts[1]) return false;
    return parts[0] === month.getFullYear() && parts[1] - 1 === month.getMonth();
  }

  private saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
