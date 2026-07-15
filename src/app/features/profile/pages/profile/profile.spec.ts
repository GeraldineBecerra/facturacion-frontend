import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { TenantContextService } from '../../../../core/tenant/tenant-context.service';
import { CompanyResponse } from '../../../company/models/company.model';
import { CompanyService } from '../../../company/services/company.service';
import { Profile } from './profile';

describe('Profile module', () => {
  const company = {
    id: 6,
    razonSocial: 'Globant Chile',
    nombreFantasia: 'Globant',
  } as CompanyResponse;

  beforeEach(() => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:logo');
    spyOn(URL, 'revokeObjectURL');
  });

  it('loads the company from the authenticated session and its logo', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['findById', 'getLogo']);
    const tenant = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], { companyId: null });
    auth.companyId.and.returnValue(6);
    auth.role.and.returnValue('ROLE_ADMIN');
    service.findById.and.returnValue(of(company));
    service.getLogo.and.returnValue(of(new Blob(['logo'], { type: 'image/png' })));
    const component = new Profile(auth, service, tenant);

    component.ngOnInit();

    expect(component.company).toBe(company);
    expect(component.logoPreviewUrl).toBe('blob:logo');
    expect(component.companyInitials).toBe('G');
  });

  it('allows global super admin sessions without selected company', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const tenant = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], { companyId: null });
    auth.companyId.and.returnValue(null);
    auth.role.and.returnValue('ROLE_SUPER_ADMIN');
    const component = new Profile(auth, {} as CompanyService, tenant);

    component.loadCompany();

    expect(component.company).toBeNull();
    expect(component.error).toBeNull();
    expect(component.isGlobalSession).toBeTrue();
  });

  it('uploads a valid logo and reloads the preview', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['uploadLogo', 'getLogo']);
    const tenant = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], { companyId: null });
    service.uploadLogo.and.returnValue(of(void 0));
    service.getLogo.and.returnValue(of(new Blob(['logo'], { type: 'image/png' })));
    const component = new Profile(auth, service, tenant);
    component.company = company;
    const input = document.createElement('input');
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });

    component.onLogoSelected({ target: input } as unknown as Event);

    expect(service.uploadLogo).toHaveBeenCalledWith(6, file);
    expect(component.logoSuccess).toContain('actualizado');
  });

  it('validates logo uploads and deletes persisted logos', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['deleteLogo']);
    const tenant = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], { companyId: null });
    service.deleteLogo.and.returnValue(of(void 0));
    const component = new Profile(auth, service, tenant);
    component.company = company;
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File(['bad'], 'logo.gif', { type: 'image/gif' })],
    });

    component.onLogoSelected({ target: input } as unknown as Event);

    expect(component.logoError).toContain('PNG');
    component.deleteLogo();

    expect(service.deleteLogo).toHaveBeenCalledWith(6);
    expect(component.logoSuccess).toContain('eliminado');
  });

  it('maps role labels and rejects oversized logos', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const tenant = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], { companyId: null });
    auth.role.and.returnValues('ROLE_SUPER_ADMIN', 'ROLE_USER', null);
    const component = new Profile(auth, {} as CompanyService, tenant);
    component.company = { ...company, nombreFantasia: '', razonSocial: 'Demo Empresa' };
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File([new Uint8Array(1024 * 1024 + 1)], 'logo.jpg', { type: 'image/jpeg' })],
    });

    expect(component.roleLabel).toBe('Superadministrador');
    expect(component.roleLabel).toBe('Usuario');
    expect(component.roleLabel).toBe('Sin rol');
    expect(component.companyInitials).toBe('DE');

    component.onLogoSelected({ target: input } as unknown as Event);

    expect(component.logoError).toContain('1 MB');
  });

  it('shows profile load errors for non-global sessions', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['findById']);
    const tenant = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], { companyId: 6 });
    auth.companyId.and.returnValue(null);
    auth.role.and.returnValue('ROLE_ADMIN');
    service.findById.and.returnValue(throwError(() => new Error('boom')));
    const component = new Profile(auth, service, tenant);

    component.loadCompany();

    expect(component.error).toContain('empresa asociada');
  });

  it('shows ROLE_USER profile data from the session when company administration is forbidden', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId', 'companyName', 'hasAnyRole']);
    const service = jasmine.createSpyObj<CompanyService>('CompanyService', ['findById', 'getLogo']);
    const tenant = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], { companyId: null });
    auth.companyId.and.returnValue(6);
    auth.companyName.and.returnValue('Empresa del Usuario');
    auth.role.and.returnValue('ROLE_USER');
    auth.hasAnyRole.and.returnValue(false);
    service.findById.and.returnValue(throwError(() => ({ status: 403 })));
    service.getLogo.and.returnValue(throwError(() => ({ status: 404 })));
    const component = new Profile(auth, service, tenant);

    component.loadCompany();

    expect(component.error).toBeNull();
    expect(component.company?.id).toBe(6);
    expect(component.company?.razonSocial).toBe('Empresa del Usuario');
    expect(component.canManageLogo).toBeFalse();
  });
});
