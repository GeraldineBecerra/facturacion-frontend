import { Component } from '@angular/core';
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

interface Customer {
  id: number;
  rut: string;
  businessName: string;
  shortName: string;
  type: 'Corporativo' | 'Persona' | 'Gubernamental';
  active: boolean;
}

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [
    FormsModule,
    DynamicTableComponent,
    PageHeaderComponent,
    UiButtonComponent,
    UiInputComponent,
  ],
  templateUrl: './customers-list.html',
  styleUrl: './customers-list.scss',
})
export class CustomersList {
  filters = { search: '', type: '' };

  columns: TableColumn[] = [
    { key: 'rut', label: 'RUT', sortable: true },
    { key: 'businessName', label: 'Razón social', type: 'avatar', avatarKey: 'rut' },
    { key: 'shortName', label: 'Nombre corto' },
    {
      key: 'type',
      label: 'Tipo',
      type: 'badge',
      badgeColors: {
        Corporativo: 'bg-blue-100 text-blue-800',
        Persona: 'bg-orange-100 text-orange-800',
        Gubernamental: 'bg-violet-100 text-violet-800',
      },
    },
    { key: 'active', label: 'Activo', type: 'boolean', trueLabel: 'Sí', falseLabel: 'No' },
  ];

  actions: TableAction[] = [
    {
      type: 'custom',
      label: 'Editar cliente',
      clickFn: (customer) => this.editCustomer(customer),
      colorClass: 'text-blue-600 hover:bg-blue-50',
    },
    {
      type: 'delete',
      label: 'Eliminar cliente',
      clickFn: (customer) => this.deleteCustomer(customer),
    },
  ];

  customers: Customer[] = [
    { id: 1, rut: '76.452.129-K', businessName: 'Constructora Horizonte SpA', shortName: 'Horizonte', type: 'Corporativo', active: true },
    { id: 2, rut: '15.982.334-0', businessName: 'Andrés Ignacio Valdés', shortName: 'A. Valdés', type: 'Persona', active: true },
    { id: 3, rut: '99.003.442-8', businessName: 'Metrópolis Inmobiliaria Ltda.', shortName: 'Metrópolis', type: 'Corporativo', active: true },
    { id: 4, rut: '77.123.889-4', businessName: 'Alpha Steel Corp', shortName: 'Alpha', type: 'Corporativo', active: false },
    { id: 5, rut: '18.445.902-1', businessName: 'María José Pereira', shortName: 'M. Pereira', type: 'Persona', active: true },
  ];

  filteredCustomers = [...this.customers];

  constructor(private router: Router) {}

  get corporateCustomers(): number {
    return this.customers.filter((customer) => customer.type === 'Corporativo').length;
  }

  createCustomer(): void {
    this.router.navigate(['/clientes/nuevo']);
  }

  search(): void {
    const term = this.filters.search.trim().toLowerCase();
    this.filteredCustomers = this.customers.filter((customer) => {
      const matchesTerm = !term || [customer.rut, customer.businessName, customer.shortName]
        .some((value) => value.toLowerCase().includes(term));
      return matchesTerm && (!this.filters.type || customer.type === this.filters.type);
    });
  }

  clearFilters(): void {
    this.filters = { search: '', type: '' };
    this.filteredCustomers = [...this.customers];
  }

  editCustomer(customer: Customer): void {
    this.router.navigate(['/clientes/nuevo'], { queryParams: { id: customer.id } });
  }

  deleteCustomer(customer: Customer): void {
    this.customers = this.customers.filter((item) => item.id !== customer.id);
    this.search();
  }
}
