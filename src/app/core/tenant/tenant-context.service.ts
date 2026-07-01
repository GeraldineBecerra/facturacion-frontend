import { Injectable, signal } from '@angular/core';
import { CompanyResponse } from '../../features/company/models/company.model';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly storageKey = 'selected_company';
  private readonly selectedCompanyState = signal<CompanyResponse | null>(this.readCompany());

  readonly selectedCompany = this.selectedCompanyState.asReadonly();

  get companyId(): number | null {
    return this.selectedCompanyState()?.id ?? null;
  }

  selectCompany(company: CompanyResponse): void {
    sessionStorage.setItem(this.storageKey, JSON.stringify(company));
    this.selectedCompanyState.set(company);
  }

  clear(): void {
    sessionStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.storageKey);
    this.selectedCompanyState.set(null);
  }

  private readCompany(): CompanyResponse | null {
    const value = sessionStorage.getItem(this.storageKey);
    if (!value) return null;

    try {
      const company = JSON.parse(value) as CompanyResponse;
      return company?.id ? company : null;
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
