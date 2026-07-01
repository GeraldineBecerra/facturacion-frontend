import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { DynamicTableComponent, TableAction, TableColumn } from '../../../../shared/components/table/table';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { BillingDocument } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DynamicTableComponent, PageHeaderComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './billing-list.html',
  styleUrl: './billing-list.scss',
})
export class BillingList implements OnInit {
  readonly monthlySummary = [
    { label: 'Ene', value: 32 }, { label: 'Feb', value: 48 }, { label: 'Mar', value: 61 },
    { label: 'Abr', value: 79 }, { label: 'May', value: 55 }, { label: 'Jun', value: 94 },
    { label: 'Jul', value: 41 },
  ];

  filters = { folio: '', rutEmisor: '', razonSocial: '', estado: '' };
  documents: BillingDocument[] = [];
  filteredDocuments: BillingDocument[] = [];
  isLoading = false;
  error: string | null = null;

  columns: TableColumn[] = [
    {
      key: 'folio',
      label: 'N° factura',
      sortable: true,
      formatter: (_value, document: BillingDocument) => this.getInvoiceNumber(document),
    },
    { key: 'tipoDocumento', label: 'Tipo DTE' },
    { key: 'fechaEmision', label: 'Emisión', type: 'date' },
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
  ];

  actions: TableAction[] = [{
    type: 'custom',
    label: 'Ver documento',
    clickFn: (document) => this.viewDocument(document),
    colorClass: 'text-blue-600 hover:bg-blue-50',
  }];

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

  getInvoiceNumber(document: BillingDocument): string {
    return String(document.folio ?? document.numeroDocumento ?? document.numeroFactura ?? 'Sin folio');
  }

  getDocumentStatus(document: BillingDocument): string {
    const status = document.estadoDocumento ?? document.estadoSii ?? document.estado ?? 'BORRADOR';
    return status.toUpperCase();
  }
}
