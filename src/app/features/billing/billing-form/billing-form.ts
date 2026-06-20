import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/header/page-header.component';
import { UiButtonComponent } from '../../../shared/ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../../shared/ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../../shared/ui/ui-input/ui-input.component';

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
  moneda: 'CLP' | 'USD' | 'EUR';
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

  constructor(private router: Router) {}

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

  selectCurrency(currency: 'CLP' | 'USD' | 'EUR'): void {
    this.billing.moneda = currency;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.importedFileName = input.files?.[0]?.name ?? '';
  }

  saveDraft(): void {
    console.log('Borrador de factura', this.buildPayload());
  }

  cancel(): void {
    this.router.navigate(['/facturacion']);
  }

  saveBilling(): void {
    console.log('Factura a guardar', this.buildPayload());
    this.router.navigate(['/facturacion']);
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
}
