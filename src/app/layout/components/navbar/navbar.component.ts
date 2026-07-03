import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Bell, Menu, Search } from 'lucide-angular';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { EconomicIndicator, EconomicIndicatorsService } from '../../../core/economic-indicators/economic-indicators.service';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';
import { CompanyResponse } from '../../../features/company/models/company.model';
import { CompanyService } from '../../../features/company/services/company.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss',
    imports: [CommonModule, FormsModule, LucideAngularModule]
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
    indicators: EconomicIndicator[] = [];
    isLoadingIndicators = false;
    indicatorError: string | null = null;
    indicatorSlowLoading = false;
    private indicatorSlowLoadingTimer?: ReturnType<typeof setTimeout>;

    constructor(
        public auth: AuthService,
        public tenantContext: TenantContextService,
        private companyService: CompanyService,
        private economicIndicatorsService: EconomicIndicatorsService,
        private router: Router,
    ) {
        this.auth.authState$.subscribe(() => {
            if (this.auth.isAuthenticated()) {
                this.loadIndicators();
            } else {
                this.indicators = [];
                this.indicatorError = 'Indicadores económicos disponibles después de iniciar sesión.';
            }
        });
    }

    ngOnInit(): void {
        if (this.auth.isAuthenticated()) {
            this.loadIndicators();
        } else {
            this.indicatorError = 'Indicadores económicos disponibles después de iniciar sesión.';
        }

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

    formatIndicatorValue(value: number | string | null): string {
        if (value === null || value === undefined) return 'No disponible';
        const n = typeof value === 'number' ? value : Number(String(value).replace(/\./g, '').replace(/,/g, '.'));
        if (!Number.isFinite(n)) return 'No disponible';
        try {
            return new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                maximumFractionDigits: 0,
            }).format(n);
        } catch {
            return 'No disponible';
        }
    }

    indicatorTrendIcon(code: EconomicIndicator['code'] | string): string {
        const icons: Record<string, string> = {
            uf: 'trending_up',
            utm: 'horizontal_rule',
            dolar: 'trending_down',
            euro: 'trending_up',
        };
        return icons[code] ?? 'horizontal_rule';
    }

    indicatorTrendClass(code: EconomicIndicator['code'] | string): string {
        const classes: Record<string, string> = {
            uf: 'text-green-400',
            utm: 'text-blue-200',
            dolar: 'text-red-400',
            euro: 'text-green-400',
        };
        return classes[code] ?? 'text-slate-400';
    }

    changeCompany(companyId: number | string): void {
        const id = Number(companyId);
        if (!id || id === this.tenantContext.companyId) return;

        const company = this.companies.find((item) => item.id === id);
        if (!company) return;

        this.tenantContext.selectCompany(company);
        this.selectedCompanyId = company.id;
        this.currentCompany = company;

        // Si es ROLE_SUPER_ADMIN, mantener en el dashboard de super-admin
        const dashboardRoute = this.auth.role() === 'ROLE_SUPER_ADMIN' 
            ? '/dashboard/super-admin' 
            : '/dashboard/admin';
        this.router.navigateByUrl(dashboardRoute);
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

    retryLoadingIndicators(): void {
        this.loadIndicators();
    }

    keepWaitingForIndicators(): void {
        this.indicatorSlowLoading = false;
    }

    private loadIndicators(): void {
        this.isLoadingIndicators = true;
        this.indicatorError = null;
        this.indicatorSlowLoading = false;
        this.indicators = [];

        if (this.indicatorSlowLoadingTimer) {
            clearTimeout(this.indicatorSlowLoadingTimer);
        }

        this.indicatorSlowLoadingTimer = setTimeout(() => {
            if (this.isLoadingIndicators) {
                this.indicatorSlowLoading = true;
            }
        }, 4000);

        this.economicIndicatorsService.getIndicators()
            .pipe(finalize(() => {
                this.isLoadingIndicators = false;
                this.indicatorSlowLoading = false;
                if (this.indicatorSlowLoadingTimer) {
                    clearTimeout(this.indicatorSlowLoadingTimer);
                    this.indicatorSlowLoadingTimer = undefined;
                }
            }))
            .subscribe({
                next: (indicators) => {
                    this.indicators = indicators ?? [];
                },
                error: (err) => {
                    console.error('Error loading economic indicators', err);
                    this.indicators = [];
                    this.indicatorError = 'No fue posible cargar los indicadores económicos. Verifica tu sesión o intenta nuevamente más tarde.';
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
