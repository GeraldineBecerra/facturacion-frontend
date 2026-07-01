import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { DynamicTableComponent, TableAction, TableColumn } from '../../../../shared/components/table/table';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { CustomerResponse } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [FormsModule, DynamicTableComponent, PageHeaderComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './customers-list.html',
  styleUrl: './customers-list.scss',
})
export class CustomersList implements OnInit {
  filters = { search: '', status: '' };
  customers: CustomerResponse[] = [];
  filteredCustomers: CustomerResponse[] = [];
  isLoading = false;
  error: string | null = null;

  columns: TableColumn[] = [
    { key: 'rut', label: 'RUT', sortable: true },
    { key: 'razonSocial', label: 'Razón social', type: 'avatar', avatarKey: 'rut' },
    { key: 'nombreFantasia', label: 'Nombre de fantasía' },
    { key: 'email', label: 'Email' },
    { key: 'activo', label: 'Activo', type: 'boolean', trueLabel: 'Sí', falseLabel: 'No' },
  ];

  actions: TableAction[] = [
    {
      type: 'edit',
      label: 'Editar cliente',
      routerLinkFn: (customer) => ['/clientes', customer.id, 'editar'],
    },
    {
      type: 'delete',
      label: 'Eliminar cliente',
      clickFn: (customer) => this.deleteCustomer(customer),
    },
  ];

  constructor(private router: Router, private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  get activeCustomers(): number {
    return this.customers.filter((customer) => customer.activo).length;
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.error = null;
    this.customerService.findAll().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (customers) => {
        this.customers = customers;
        this.search();
      },
      error: () => this.error = 'No fue posible cargar los clientes.',
    });
  }

  createCustomer(): void {
    this.router.navigate(['/clientes/nuevo']);
  }

  search(): void {
    const term = this.filters.search.trim().toLowerCase();
    this.filteredCustomers = this.customers.filter((customer) => {
      const matchesTerm = !term ||
        [customer.rut, customer.razonSocial, customer.nombreFantasia, customer.email]
          .some((value) => value?.toLowerCase().includes(term));
      const matchesStatus = !this.filters.status || String(customer.activo) === this.filters.status;
      return matchesTerm && matchesStatus;
    });
  }

  clearFilters(): void {
    this.filters = { search: '', status: '' };
    this.search();
  }

  deleteCustomer(customer: CustomerResponse): void {
    if (!window.confirm(`¿Eliminar al cliente "${customer.razonSocial}"?`)) return;
    this.customerService.delete(customer.id).subscribe({
      next: () => {
        this.customers = this.customers.filter((item) => item.id !== customer.id);
        this.search();
      },
      error: () => this.error = 'No fue posible eliminar el cliente.',
    });
  }
}
