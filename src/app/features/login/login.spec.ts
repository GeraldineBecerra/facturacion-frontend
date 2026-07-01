import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Login } from './login';

describe('Login module', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let route: any;
  let component: Login;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'landingRoute',
      'login',
      'role',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    route = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy('get').and.returnValue('/clientes'),
        },
      },
    };
    component = new Login(auth, route, router);
  });

  it('redirects authenticated users to their landing route', () => {
    auth.isAuthenticated.and.returnValue(true);
    auth.landingRoute.and.returnValue('/facturacion');

    component.ngOnInit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/facturacion');
  });

  it('logs in and respects a valid returnUrl for normal users', () => {
    auth.login.and.returnValue(of({ token: 'jwt' } as any));
    auth.role.and.returnValue('ROLE_USER');
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.credentials = { username: 'ana', password: 'secret' };
    component.submit(form);

    expect(auth.login).toHaveBeenCalledWith(component.credentials, true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/clientes');
    expect(component.isLoading).toBeFalse();
  });

  it('shows backend login errors', () => {
    auth.login.and.returnValue(throwError(() => ({ error: { message: 'Credenciales invalidas' } })));
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.submit(form);

    expect(component.error).toBe('Credenciales invalidas');
  });
});
