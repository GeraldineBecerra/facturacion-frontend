import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Login } from './login';

describe('Login module', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let component: Login;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'landingRoute',
      'login',
      'role',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    component = new Login(auth, router);
  });

  it('redirects authenticated users to their landing route', () => {
    auth.isAuthenticated.and.returnValue(true);
    auth.landingRoute.and.returnValue('/dashboard/admin');

    component.ngOnInit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/admin');
  });

  it('logs in and sends users to their landing dashboard', () => {
    auth.login.and.returnValue(of({ token: 'jwt' } as any));
    auth.landingRoute.and.returnValue('/dashboard/admin');
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.credentials = { username: 'ana', password: 'secret' };
    component.submit(form);

    expect(auth.login).toHaveBeenCalledWith(component.credentials, true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/admin');
    expect(component.isLoading).toBeFalse();
  });

  it('sends super admins directly to their dashboard', () => {
    auth.login.and.returnValue(of({ token: 'jwt' } as any));
    auth.landingRoute.and.returnValue('/dashboard/super-admin');
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.submit(form);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/super-admin');
  });

  it('shows backend login errors', () => {
    auth.login.and.returnValue(throwError(() => ({ error: { message: 'Credenciales invalidas' } })));
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.submit(form);

    expect(component.error).toBe('Credenciales invalidas');
  });
});
