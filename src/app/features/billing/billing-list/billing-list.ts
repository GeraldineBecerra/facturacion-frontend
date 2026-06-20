import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/header/page-header.component';
import {
  DynamicTableComponent,
  TableAction,
  TableColumn,
} from '../../../shared/components/table/table';
import { UiButtonComponent } from '../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/ui/ui-input/ui-input.component';

interface BillingDocument {
  id: number;
  folio: string;
  tipo: string;
  fechaEmision: string;
  razonSocial: string;
  rutEmisor: string;
  total: number;
  estado: 'Pendiente' | 'Aceptada' | 'Reclamada';
}

@Component({
  selector: 'app-billing-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DynamicTableComponent,
    PageHeaderComponent,
    UiButtonComponent,
    UiInputComponent,
  ],
  templateUrl: './billing-list.html',
  styleUrl: './billing-list.scss',
})
export class BillingList {
  readonly monthlySummary = [
    { label: 'Ene', value: 32 },
    { label: 'Feb', value: 48 },
    { label: 'Mar', value: 61 },
    { label: 'Abr', value: 79 },
    { label: 'May', value: 55 },
    { label: 'Jun', value: 94 },
    { label: 'Jul', value: 41 },
  ];

  filters = { folio: '', rutEmisor: '', razonSocial: '', estado: '' };

  columns: TableColumn[] = [
    { key: 'folio', label: 'Folio', sortable: true },
    { key: 'tipo', label: 'Tipo DTE' },
    {
      key: 'fechaEmision',
      label: 'Emisión',
      formatter: (value) =>
        new Intl.DateTimeFormat('es-CL').format(new Date(`${value}T00:00:00`)),
    },
    { key: 'razonSocial', label: 'Emisor', type: 'avatar', avatarKey: 'rutEmisor' },
    {
      key: 'total',
      label: 'Total',
      formatter: (value) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value),
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        Pendiente: 'bg-amber-100 text-amber-800',
        Aceptada: 'bg-emerald-100 text-emerald-800',
        Reclamada: 'bg-red-100 text-red-800',
      },
    },
  ];

  actions: TableAction[] = [
    {
      type: 'custom',
      label: 'Ver documento',
      clickFn: (document) => this.viewDocument(document),
      colorClass: 'text-blue-600 hover:bg-blue-50',
    },
  ];

  documents: BillingDocument[] = [
    {
      id: 1,
      folio: '85042',
      tipo: 'Factura Electrónica',
      fechaEmision: '2026-06-18',
      razonSocial: 'Techno Logistics SpA',
      rutEmisor: '76.543.210-K',
      total: 1240000,
      estado: 'Pendiente',
    },
    {
      id: 2,
      folio: '129482',
      tipo: 'Factura Electrónica',
      fechaEmision: '2026-06-15',
      razonSocial: 'Constructora del Sur Ltda.',
      rutEmisor: '96.882.112-4',
      total: 45600,
      estado: 'Aceptada',
    },
    {
      id: 3,
      folio: '441',
      tipo: 'Nota de Crédito',
      fechaEmision: '2026-06-11',
      razonSocial: 'Office Supplies Chile',
      rutEmisor: '88.231.445-3',
      total: -8990,
      estado: 'Reclamada',
    },
  ];

  filteredDocuments = [...this.documents];

  constructor(private router: Router) {}

  get receivedTotal(): number {
    return this.documents.reduce((total, document) => total + document.total, 0);
  }

  get acceptedDocuments(): number {
    return this.documents.filter((document) => document.estado === 'Aceptada').length;
  }

  get pendingDocuments(): number {
    return this.documents.filter((document) => document.estado === 'Pendiente').length;
  }

  createBilling(): void {
    this.router.navigate(['/facturacion/nueva']);
  }

  search(): void {
    const folio = this.filters.folio.trim().toLowerCase();
    const rut = this.filters.rutEmisor.trim().toLowerCase();
    const razonSocial = this.filters.razonSocial.trim().toLowerCase();

    this.filteredDocuments = this.documents.filter((document) =>
      (!folio || document.folio.toLowerCase().includes(folio)) &&
      (!rut || document.rutEmisor.toLowerCase().includes(rut)) &&
      (!razonSocial || document.razonSocial.toLowerCase().includes(razonSocial)) &&
      (!this.filters.estado || document.estado === this.filters.estado)
    );
  }

  clearFilters(): void {
    this.filters = { folio: '', rutEmisor: '', razonSocial: '', estado: '' };
    this.filteredDocuments = [...this.documents];
  }

  viewDocument(document: BillingDocument): void {
    console.log('Ver documento tributario', document);
  }
}
