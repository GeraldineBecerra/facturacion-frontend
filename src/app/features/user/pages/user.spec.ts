import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CompanyResponse } from '../../company/models/company.model';
import { CompanyService } from '../../company/services/company.service';
import { UserResponse } from '../models/user.model';
import { UserService } from '../services/user.service';
import { UserForm } from './user-form/user-form';
import { UserList } from './user-list/user-list';

describe('User module', () => {
  const user: UserResponse = {
    id: 1,
    username: 'ana',
    rol: 'ROLE_USER',
    rolMostrar: 'Usuario',
    activo: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  };
  const company = { id: 6, razonSocial: 'Empresa', activo: true } as CompanyResponse;

  it('loads users and toggles status', () => {
    const service = jasmine.createSpyObj<UserService>('UserService', ['findAll', 'changeStatus']);
    service.findAll.and.returnValue(of([user]));
    service.changeStatus.and.returnValue(of({ ...user, activo: false }));
    const component = new UserList({} as Router, service);

    component.ngOnInit();
    component.toggleStatus(user);

    expect(component.users[0].activo).toBeFalse();
    expect(service.changeStatus).toHaveBeenCalledWith(1, false);
  });

  it('loads all active companies for super admin user creation', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const companyService = jasmine.createSpyObj<CompanyService>('CompanyService', ['findAll']);
    const userService = jasmine.createSpyObj<UserService>('UserService', ['create']);
    auth.role.and.returnValue('ROLE_SUPER_ADMIN');
    companyService.findAll.and.returnValue(of([company, { ...company, id: 7, activo: false }]));
    const component = new UserForm(router, auth, companyService, userService);

    component.ngOnInit();

    expect(component.companies.map((item) => item.id)).toEqual([6]);
  });

  it('creates users with the selected company and navigates back', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const companyService = jasmine.createSpyObj<CompanyService>('CompanyService', ['findAll']);
    const userService = jasmine.createSpyObj<UserService>('UserService', ['create', 'changeStatus']);
    auth.role.and.returnValue('ROLE_SUPER_ADMIN');
    userService.create.and.returnValue(of(user));
    const component = new UserForm(router, auth, companyService, userService);
    component.user = { username: 'ana', password: 'secret', rol: 'ROLE_USER', companyId: 6, activo: true };
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.saveUser(form);

    expect(userService.create).toHaveBeenCalledWith({ username: 'ana', password: 'secret', rol: 'ROLE_USER' }, 6);
    expect(router.navigate).toHaveBeenCalledWith(['/usuarios']);
  });

  it('loads the current company for non-super-admin users', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const companyService = jasmine.createSpyObj<CompanyService>('CompanyService', ['findById']);
    const userService = jasmine.createSpyObj<UserService>('UserService', ['create']);
    auth.role.and.returnValue('ROLE_ADMIN');
    auth.companyId.and.returnValue(6);
    companyService.findById.and.returnValue(of(company));
    const component = new UserForm(router, auth, companyService, userService);

    component.ngOnInit();

    expect(component.user.companyId).toBe(6);
    expect(component.currentCompanyName).toBe('Empresa');
  });

  it('creates inactive users and reports status update failures', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const companyService = jasmine.createSpyObj<CompanyService>('CompanyService', ['findAll']);
    const userService = jasmine.createSpyObj<UserService>('UserService', ['create', 'changeStatus']);
    auth.role.and.returnValue('ROLE_ADMIN');
    auth.companyId.and.returnValue(6);
    userService.create.and.returnValue(of({ ...user, activo: true }));
    userService.changeStatus.and.returnValue(throwError(() => new Error('boom')));
    const component = new UserForm(router, auth, companyService, userService);
    component.user = { username: 'ana', password: 'secret', rol: 'ROLE_ADMIN', companyId: 6, activo: false };
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.saveUser(form);

    expect(userService.create).toHaveBeenCalledWith({ username: 'ana', password: 'secret', rol: 'ROLE_USER' }, 6);
    expect(userService.changeStatus).toHaveBeenCalledWith(1, false, 6);
    expect(component.error).toContain('estado');
  });

  it('validates required company information before creating users', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['role', 'companyId']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const userService = jasmine.createSpyObj<UserService>('UserService', ['create']);
    auth.role.and.returnValue('ROLE_SUPER_ADMIN');
    const component = new UserForm(router, auth, {} as CompanyService, userService);
    const form = { invalid: true, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.saveUser(form);
    component.togglePassword();
    component.cancel();

    expect(form.control.markAllAsTouched).toHaveBeenCalled();
    expect(component.showPassword).toBeTrue();
    expect(router.navigate).toHaveBeenCalledWith(['/usuarios']);
    expect(userService.create).not.toHaveBeenCalled();
  });

  it('shows an auth message when user loading is forbidden', () => {
    const service = jasmine.createSpyObj<UserService>('UserService', ['findAll']);
    service.findAll.and.returnValue(throwError(() => ({ status: 403 })));
    const component = new UserList({} as Router, service);

    component.loadUsers();

    expect(component.error).toContain('JWT');
  });
});
