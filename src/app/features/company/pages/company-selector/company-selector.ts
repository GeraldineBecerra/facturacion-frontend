import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { TenantContextService } from '../../../../core/tenant/tenant-context.service';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { CompanyResponse } from '../../models/company.model';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-company-selector',
  standalone: true,
  imports: [FormsModule, UiButtonComponent, UiInputComponent],
  templateUrl: './company-selector.html',
  styleUrl: './company-selector.scss',
})
export class CompanySelector implements OnInit {
  companies: CompanyResponse[] = [];
  filteredCompanies: CompanyResponse[] = [];
  searchTerm = '';
  isLoading = false;
  error: string | null = null;

  constructor(
    public auth: AuthService,
    private companyService: CompanyService,
    private tenantContext: TenantContextService,
    private router: Router,
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
        next: (companies) => {
          this.companies = companies.filter((company) => company.activo);
          this.filter();
        },
        error: () => this.error = 'No fue posible cargar las empresas disponibles.',
      });
  }

  filter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCompanies = !term
      ? [...this.companies]
      : this.companies.filter((company) =>
          [company.rutEmpresa, company.razonSocial, company.nombreFantasia]
            .some((value) => value?.toLowerCase().includes(term))
        );
  }

  select(company: CompanyResponse): void {
    this.tenantContext.selectCompany(company);
    this.router.navigate(['/dashboard/admin']);
  }

  logout(): void {
    this.auth.logout();
  }
}
