import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Bell, Menu, Search } from 'lucide-angular';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';
import { CompanyResponse } from '../../../features/company/models/company.model';
import { CompanyService } from '../../../features/company/services/company.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    templateUrl: './navbar.component.html',
    imports: [FormsModule, LucideAngularModule]
})
export class NavbarComponent implements OnInit {

    @Output() toggleSidebar = new EventEmitter<void>();
    readonly Menu = Menu;
    readonly Bell = Bell;
    readonly Search = Search;

    companies: CompanyResponse[] = [];
    currentCompany: CompanyResponse | null = null;
    selectedCompanyId: number | null = null;
    isLoadingCompanies = false;

    constructor(
        public auth: AuthService,
        public tenantContext: TenantContextService,
        private companyService: CompanyService,
    ) {}

    ngOnInit(): void {
        if (this.auth.role() === 'ROLE_SUPER_ADMIN') {
            this.currentCompany = this.tenantContext.selectedCompany();
            this.selectedCompanyId = this.tenantContext.companyId;
            this.loadCompanies();
            return;
        }

        const companyId = this.auth.companyId();
        if (companyId) {
            this.selectedCompanyId = companyId;
            this.setCurrentCompanyFromToken(companyId);
        }
    }

    changeCompany(companyId: number | string): void {
        const id = Number(companyId);
        if (!id || id === this.tenantContext.companyId) return;

        const company = this.companies.find((item) => item.id === id);
        if (!company) return;

        this.tenantContext.selectCompany(company);
        this.selectedCompanyId = company.id;
        this.currentCompany = company;

        // Recarga la ruta actual para que sus tablas vuelvan a consultar con el nuevo tenant.
        window.location.reload();
    }

    private loadCompanies(): void {
        this.isLoadingCompanies = true;
        this.companyService.findAll()
            .pipe(finalize(() => this.isLoadingCompanies = false))
            .subscribe({
                next: (companies) => {
                    this.companies = companies.filter((company) => company.activo);
                    const selected = this.companies.find((company) => company.id === this.selectedCompanyId);
                    if (selected) {
                        this.currentCompany = selected;
                        this.tenantContext.selectCompany(selected);
                    }
                },
            });
    }

    private setCurrentCompanyFromToken(companyId: number): void {
        const companyName = this.auth.companyName();
        this.currentCompany = {
            id: companyId,
            razonSocial: companyName || 'Empresa activa',
            nombreFantasia: companyName || 'Empresa activa',
        } as CompanyResponse;
    }

}
