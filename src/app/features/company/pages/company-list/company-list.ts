import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  DynamicTableComponent,
  TableAction,
  TableColumn,
} from '../../../../shared/components/table/table';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { CompanyResponse } from '../../models/company.model';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [DynamicTableComponent, PageHeaderComponent],
  templateUrl: './company-list.html',
})
export class CompaniesList implements OnInit {
  companies: CompanyResponse[] = [];
  isLoading = false;
  error: string | null = null;

  columns: TableColumn[] = [
    { key: 'rutEmpresa', label: 'RUT' },
    { key: 'razonSocial', label: 'Razón social', type: 'avatar', avatarKey: 'nombreFantasia' },
    { key: 'giro', label: 'Giro' },
    {
      key: 'activo',
      label: 'Estado',
      type: 'boolean',
      trueLabel: 'Activa',
      falseLabel: 'Inactiva',
    },
    { key: 'createdAt', label: 'Creación', type: 'date' },
  ];

  actions: TableAction[] = [
    {
      type: 'edit',
      label: 'Editar empresa',
      icon: 'edit',
      routerLinkFn: (company) => ['/empresas', company.id, 'editar'],
    },
    {
      type: 'custom',
      label: 'Cambiar estado',
      clickFn: (company) => this.toggleStatus(company),
      colorClass: 'text-amber-600 hover:bg-amber-50',
    },
  ];

  constructor(
    private router: Router,
    private companyService: CompanyService,
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.isLoading = true;
    this.error = null;

    this.companyService.findAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (companies) => this.companies = companies,
        error: () => {
          this.error = 'No fue posible cargar las empresas. Verifica que el backend esté ejecutándose.';
        },
      });
  }

  createCompany(): void {
    this.router.navigate(['/empresas/nueva']);
  }

  toggleStatus(company: CompanyResponse): void {
    this.companyService.changeStatus(company.id, !company.activo).subscribe({
      next: (updatedCompany) => {
        this.companies = this.companies.map((item) =>
          item.id === updatedCompany.id ? updatedCompany : item
        );
      },
      error: () => {
        this.error = 'No fue posible cambiar el estado de la empresa.';
      },
    });
  }
}
