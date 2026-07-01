import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { CustomerResponse } from '../../../customers/models/customer.model';
import { CustomerService } from '../../../customers/services/customer.service';
import { BillingDocument, BillingImportPreview } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';

interface BillingFormModel {
  tipoDocumento: string;
  folio: string;
  numeroDocumento: string;
  fechaEmision: string;
  fechaVencimiento: string;
  rutReceptor: string;
  razonSocial: string;
  giro: string;
  email: string;
  direccion: string;
  ciudad: string;
  comuna: string;
  pais: string;
  glosaInterna: string;
  codigoInterno: string;
  condicionPago: string;
  porcentajeIva: number;
  tipoCambio: number;
  motivo: string;
  moneda: 'CLP' | 'USD' | 'EUR' | 'UF';
  observaciones: string;
  exenta: boolean;
}

interface BillingDetail {
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  descuento: number;
}

@Component({
  selector: 'app-billing-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    UiButtonComponent,
    UiCheckboxComponent,
    UiInputComponent,
  ],
  templateUrl: './billing-form.html',
  styleUrl: './billing-form.scss',
})
export class BillingForm {
  billing: BillingFormModel = {
    tipoDocumento: '33',
    folio: '',
    numeroDocumento: '',
    fechaEmision: '',
    fechaVencimiento: '',
    rutReceptor: '',
    razonSocial: '',
    giro: '',
    email: '',
    direccion: '',
    ciudad: '',
    comuna: '',
    pais: 'Chile',
    glosaInterna: '',
    codigoInterno: '',
    condicionPago: 'credito-30',
    porcentajeIva: 19,
    tipoCambio: 1,
    motivo: '',
    moneda: 'CLP',
    observaciones: '',
    exenta: false,
  };

  details: BillingDetail[] = [
    {
      descripcion: '',
      cantidad: 1,
      unidadMedida: 'UN',
      precioUnitario: 0,
      descuento: 0,
    },
  ];

  importedFileName = '';
  selectedImportFile: File | null = null;
  isImporting = false;
  importError: string | null = null;
  importWarnings: string[] = [];
  importSuccess: string | null = null;
  isGeneratingPdf = false;
  isSaving = false;
  generatedDocumentId: number | null = null;

  constructor(
    private router: Router,
    private billingService: BillingService,
    private customerService: CustomerService,
  ) {}

  get subtotal(): number {
    return this.details.reduce((total, detail) => total + this.getLineTotal(detail), 0);
  }

  get ivaAmount(): number {
    return this.billing.exenta ? 0 : this.subtotal * (Number(this.billing.porcentajeIva) / 100);
  }

  get total(): number {
    return this.subtotal + this.ivaAmount;
  }

  getLineTotal(detail: BillingDetail): number {
    const gross = Number(detail.cantidad) * Number(detail.precioUnitario);
    return gross * (1 - Number(detail.descuento) / 100);
  }

  addDetail(): void {
    this.details.push({
      descripcion: '',
      cantidad: 1,
      unidadMedida: 'UN',
      precioUnitario: 0,
      descuento: 0,
    });
  }

  removeDetail(index: number): void {
    if (this.details.length > 1) {
      this.details.splice(index, 1);
    }
  }

  selectCurrency(currency: 'CLP' | 'USD' | 'EUR' | 'UF'): void {
    this.billing.moneda = currency;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importedFileName = file.name;
    this.selectedImportFile = file;
    this.isImporting = true;
    this.importError = null;
    this.importWarnings = [];
    this.importSuccess = null;
    this.generatedDocumentId = null;

    this.billingService.previewTxt(file)
      .pipe(finalize(() => this.isImporting = false))
      .subscribe({
        next: (preview) => {
          this.applyPreview(preview);
          this.importWarnings = preview.advertencias ?? [];

          if (preview.clienteId) {
            this.loadImportedCustomer(preview.clienteId);
          }

          if (!preview.clienteEncontrado || !preview.clienteId) {
            this.importError = 'No se generó la factura porque el cliente no existe en la empresa seleccionada.';
            this.selectedImportFile = null;
            return;
          }

          this.importSuccess = 'Datos cargados. Presiona Guardar factura para emitir y descargar el PDF.';
        },
        error: (error) => {
          this.importError = error.error?.mensaje
            ?? error.error?.message
            ?? 'No fue posible procesar el archivo TXT.';
          this.selectedImportFile = null;
        },
      });
  }

  downloadGeneratedPdf(): void {
    if (!this.generatedDocumentId || this.isGeneratingPdf) return;
    this.downloadPdf(this.generatedDocumentId);
  }

  saveDraft(): void {
    console.log('Borrador de factura', this.buildPayload());
  }

  cancel(): void {
    this.router.navigate(['/facturacion']);
  }

  saveBilling(): void {
    if (this.isSaving) return;

    if (!this.selectedImportFile) {
      console.log('Factura a guardar', this.buildPayload());
      this.router.navigate(['/facturacion']);
      return;
    }

    this.generateInvoicePdf(this.selectedImportFile);
  }

  private buildPayload() {
    return {
      ...this.billing,
      details: this.details.map((detail) => ({
        ...detail,
        total: this.getLineTotal(detail),
      })),
      subtotal: this.subtotal,
      iva: this.ivaAmount,
      total: this.total,
      importedFileName: this.importedFileName,
    };
  }

  private applyPreview(preview: BillingImportPreview): void {
    const moneda = ['CLP', 'USD', 'EUR', 'UF'].includes(preview.moneda)
      ? preview.moneda as BillingFormModel['moneda']
      : 'CLP';
    const neto = Number(preview.montoNeto ?? 0);
    const iva = Number(preview.montoIva ?? 0);

    this.billing.tipoDocumento = String(preview.codigoTipoDocumento);
    this.billing.razonSocial = preview.clienteRazonSocial ?? '';
    this.billing.fechaEmision = preview.fechaEmision ?? '';
    this.billing.fechaVencimiento = preview.fechaVencimiento ?? '';
    this.billing.condicionPago = this.mapPaymentCondition(preview.condicionPago);
    this.billing.moneda = moneda;
    this.billing.tipoCambio = Number(preview.tipoCambio ?? 1);
    this.billing.observaciones = preview.observaciones ?? '';
    this.billing.exenta = iva === 0;
    this.billing.porcentajeIva = neto > 0 && iva > 0
      ? Math.round((iva / neto) * 100)
      : 0;

    this.details = preview.detalles.length
      ? preview.detalles.map((detail) => ({
          descripcion: detail.descripcion,
          cantidad: Number(detail.cantidad),
          unidadMedida: 'UN',
          precioUnitario: Number(detail.precioUnitario),
          descuento: 0,
        }))
      : [{
          descripcion: '',
          cantidad: 1,
          unidadMedida: 'UN',
          precioUnitario: 0,
          descuento: 0,
        }];
  }

  private loadImportedCustomer(customerId: number): void {
    this.customerService.findById(customerId).subscribe({
      next: (customer) => this.applyCustomer(customer),
      error: () => {
        this.importWarnings = [
          ...this.importWarnings,
          'El cliente fue identificado, pero no fue posible cargar todos sus datos.',
        ];
      },
    });
  }

  private applyCustomer(customer: CustomerResponse): void {
    this.billing.rutReceptor = customer.rut ?? '';
    this.billing.razonSocial = customer.razonSocial ?? '';
    this.billing.giro = customer.giro ?? '';
    this.billing.email = customer.email ?? '';
    this.billing.direccion = customer.direccion ?? '';
    this.billing.ciudad = customer.ciudad ?? '';
    this.billing.comuna = customer.comuna ?? '';
    this.billing.pais = customer.pais ?? 'Chile';
  }

  private mapPaymentCondition(condition: string | null): string {
    const value = condition?.toLowerCase() ?? '';
    if (value.includes('30')) return 'credito-30';
    if (value.includes('contado')) return 'contado';
    if (value.includes('transfer')) return 'transferencia';
    return condition ?? 'credito-30';
  }

  private generateInvoicePdf(file: File): void {
    this.isSaving = true;
    this.isGeneratingPdf = true;
    this.importError = null;
    this.importSuccess = 'Guardando factura y generando PDF...';

    this.billingService.importTxt(file).subscribe({
      next: (result) => {
        this.generatedDocumentId = result.documento.id;
        this.downloadPdf(result.documento.id, this.getInvoiceNumber(result.documento));
      },
      error: (error) => {
        this.isSaving = false;
        this.isGeneratingPdf = false;
        this.importSuccess = null;
        this.importError = error.error?.mensaje
          ?? error.error?.message
          ?? 'No fue posible guardar la factura.';
      },
    });
  }

  private downloadPdf(documentId: number, invoiceNumber?: string): void {
    this.isGeneratingPdf = true;
    this.billingService.downloadPdf(documentId)
      .pipe(finalize(() => this.isGeneratingPdf = false))
      .subscribe({
        next: (pdf) => {
          const url = URL.createObjectURL(pdf);
          const link = document.createElement('a');
          link.href = url;
          link.download = `factura-${invoiceNumber || documentId}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          this.importError = null;
          this.importSuccess = `Factura ${invoiceNumber ? `NÂ° ${invoiceNumber}` : `#${documentId}`} creada y PDF descargado correctamente.`;
          this.isSaving = false;
        },
        error: () => {
          this.isSaving = false;
          this.importSuccess = `La factura #${documentId} fue creada, pero no se pudo descargar el PDF.`;
          this.importError = 'Puedes reintentar la descarga sin volver a subir el archivo.';
        },
      });
  }

  private getInvoiceNumber(document: BillingDocument): string | undefined {
    const number = document.folio ?? document.numeroDocumento ?? document.numeroFactura;
    return number === null || number === undefined ? undefined : String(number);
  }
}
