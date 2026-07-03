import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';
import { CompanyResponse } from '../models/company.model';
import { CompanyService } from '../services/company.service';
import { CompaniesList } from './company-list/company-list';
import { CompanySelector } from './company-selector/company-selector';
import { CompanyForm } from './company-form/company-form';

describe('Company module', () => {
  const company: CompanyResponse = {
    id: 6,
    rutEmpresa: '76011711-0',
    razonSocial: 'Globant',
    nombreFantasia: 'Globant Chile',
    giro: 'Servicios',
    direccion: 'Av Uno',
    ciudad: 'Santiago',
    comuna: 'Santiago',
    pais: 'Chile',
    telefono: '123',
    sitioWeb: '',
    emailPrincipal: 'empresa@test.cl',
    emailContabilidad: 'conta@test.cl',
    rutRepresentante: '11111111-1',
    nombreRepresentante: 'Representante',
    telefonoRepresentante: '456',
    activo: true,
    createdAt: '2026-06-01',
    updatedAt: null,
  };

  it('loads companies and updates status from the list', () => {
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['findAll', 'changeStatus']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    service.findAll.and.returnValue(of([company]));
    service.changeStatus.and.returnValue(of({ ...company, activo: false }));
    const component = new CompaniesList(router, service);

    component.ngOnInit();
    component.toggleStatus(company);

    expect(component.companies[0].activo).toBeFalse();
    expect(service.changeStatus).toHaveBeenCalledWith(6, false);
  });

  it('filters active companies and selects the tenant', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['findAll']);
    const tenant = jasmine.createSpyObj<TenantContextService>('TenantContextService', ['selectCompany']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    service.findAll.and.returnValue(of([company, { ...company, id: 7, activo: false }]));
    const component = new CompanySelector(auth, service, tenant, router);

    component.ngOnInit();
    component.searchTerm = 'globant';
    component.filter();
    component.select(company);

    expect(component.filteredCompanies.map((item) => item.id)).toEqual([6]);
    expect(tenant.selectCompany).toHaveBeenCalledWith(company);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/admin']);
  });

  it('saves a new company and uploads a selected logo before returning to the list', () => {
    const route = { snapshot: { paramMap: { get: () => null } } };
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['create', 'uploadLogo']);
    service.create.and.returnValue(of(company));
    service.uploadLogo.and.returnValue(of(void 0));
    const component = new CompanyForm(route as any, router, service);
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    component.logoFile = file;
    component.empresa = { ...component.empresa, rutEmpresa: company.rutEmpresa, razonSocial: company.razonSocial };
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.guardar(form);

    expect(service.create).toHaveBeenCalled();
    expect(service.uploadLogo).toHaveBeenCalledWith(6, file);
    expect(router.navigate).toHaveBeenCalledWith(['/empresas']);
  });

  it('loads company data in edit mode and handles missing logos gracefully', () => {
    const route = { snapshot: { paramMap: { get: () => '6' } } };
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['findById', 'getLogo']);
    service.findById.and.returnValue(of(company));
    service.getLogo.and.returnValue(throwError(() => ({ status: 404 })));
    const component = new CompanyForm(route as any, {} as Router, service);

    component.ngOnInit();

    expect(component.isEditMode).toBeTrue();
    expect(component.empresa.razonSocial).toBe('Globant');
    expect(component.hasLogo).toBeFalse();
  });

  it('validates logo type and size before accepting previews', () => {
    const component = new CompanyForm({ snapshot: { paramMap: { get: () => null } } } as any, {} as Router, {} as CompanyService);
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File(['bad'], 'logo.gif', { type: 'image/gif' })],
    });

    component.onLogoSelected({ target: input } as unknown as Event);

    expect(component.logoError).toContain('PNG');
    expect(component.logoFile).toBeNull();

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File([new Uint8Array(1024 * 1024 + 1)], 'logo.png', { type: 'image/png' })],
    });
    component.onLogoSelected({ target: input } as unknown as Event);

    expect(component.logoError).toContain('1 MB');
  });

  it('deletes persisted logos and reports backend failures', () => {
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['deleteLogo']);
    service.deleteLogo.and.returnValue(of(void 0));
    const component = new CompanyForm({ snapshot: { paramMap: { get: () => null } } } as any, {} as Router, service);
    component.companyId = 6;
    component.hasLogo = true;

    component.eliminarLogo();

    expect(component.hasLogo).toBeFalse();
    expect(service.deleteLogo).toHaveBeenCalledWith(6);

    service.deleteLogo.and.returnValue(throwError(() => ({ status: 401 })));
    component.hasLogo = true;
    component.eliminarLogo();

    expect(component.logoError).toContain('autenticaci');
  });

  it('shows form validation errors when company save is invalid', () => {
    const component = new CompanyForm({ snapshot: { paramMap: { get: () => null } } } as any, {} as any, {} as any);
    const form = { invalid: true, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.guardar(form);

    expect(form.control.markAllAsTouched).toHaveBeenCalled();
    expect(component.error).toContain('RUT');
  });

  it('surfaces company list load errors', () => {
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['findAll']);
    service.findAll.and.returnValue(throwError(() => new Error('boom')));
    const component = new CompaniesList({} as any, service);

    component.loadCompanies();

    expect(component.error).toContain('No fue posible cargar');
  });
});
