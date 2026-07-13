import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { TenantContextService } from './tenant/tenant-context.service';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { AuthService } from './auth/auth.service';
import { TokenStorageService } from './auth/token-storage.service';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ReloadRouteReuseStrategy } from './routing/reload-route-reuse.strategy';

function jwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
  });

  it('stores remembered tokens in localStorage', () => {
    service.setToken('abc', true);

    expect(service.getToken()).toBe('abc');
    expect(localStorage.getItem('token')).toBe('abc');
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('clears known token keys', () => {
    localStorage.setItem('token', 'abc');
    sessionStorage.setItem('token', 'def');
    localStorage.setItem('access_token', 'legacy');
    localStorage.setItem('accessToken', 'legacy2');

    service.clear();

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenantContextService);
  });

  it('persists and exposes the selected company', () => {
    service.selectCompany({ id: 7, razonSocial: 'Acme', nombreFantasia: 'Acme' } as any);

    expect(service.companyId).toBe(7);
    expect(service.selectedCompany()?.razonSocial).toBe('Acme');
  });

  it('clears selected company state', () => {
    service.selectCompany({ id: 7 } as any);

    service.clear();

    expect(service.companyId).toBeNull();
    expect(sessionStorage.getItem('selected_company')).toBeNull();
  });
});

describe('ReloadRouteReuseStrategy', () => {
  it('keeps the layout and reloads only the active leaf view', () => {
    const strategy = new ReloadRouteReuseStrategy();
    const leafRouteConfig = {} as any;
    const leaf = { routeConfig: leafRouteConfig, firstChild: null } as ActivatedRouteSnapshot;
    const layoutRouteConfig = {} as any;
    const layout = { routeConfig: layoutRouteConfig, firstChild: leaf } as ActivatedRouteSnapshot;

    strategy.reloadNextNavigation();

    expect(strategy.shouldReuseRoute(layout, layout)).toBeTrue();
    expect(strategy.shouldReuseRoute(leaf, leaf)).toBeFalse();
    expect(strategy.shouldReuseRoute(leaf, leaf)).toBeTrue();
  });
});

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let tokenStorage: TokenStorageService;
  let tenantContext: TenantContextService;
  const futureExp = Math.floor(Date.now() / 1000) + 3600;

  function configure(token: string | null = null): AuthService {
    localStorage.clear();
    sessionStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    tokenStorage = TestBed.inject(TokenStorageService);
    tenantContext = TestBed.inject(TenantContextService);
    if (token) {
      tokenStorage.setToken(token, true);
    }
    httpMock = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  afterEach(() => {
    httpMock?.verify();
    TestBed.resetTestingModule();
  });

  it('hydrates a valid stored admin token', () => {
    const service = configure(jwt({
      sub: 'admin',
      rol: 'ROLE_ADMIN',
      empresaId: 6,
      empresaNombre: 'Empresa',
      exp: futureExp,
    }));

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.username()).toBe('admin');
    expect(service.role()).toBe('ROLE_ADMIN');
    expect(service.companyId()).toBe(6);
    expect(service.companyName()).toBe('Empresa');
    expect(service.landingRoute()).toBe('/dashboard/admin');
  });

  it('clears invalid stored tokens', () => {
    const service = configure('not-a-jwt');

    expect(service.isAuthenticated()).toBeFalse();
    expect(tokenStorage.getToken()).toBeNull();
  });

  it('stores login tokens and clears previous tenant selection', () => {
    const service = configure();
    const token = jwt({ sub: 'user', rol: 'ROLE_USER', companyId: 9, companyName: 'Cliente', exp: futureExp });
    tenantContext.selectCompany({ id: 6 } as any);

    service.login({ username: 'user', password: 'secret' }, false).subscribe((response) => {
      expect(response.token).toBe(token);
    });

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    request.flush({ token });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.companyId()).toBe(9);
    expect(tenantContext.companyId).toBeNull();
    expect(sessionStorage.getItem('token')).toBe(token);
  });

  it('rejects login responses with invalid payloads', () => {
    const service = configure();
    let error: Error | undefined;

    service.login({ username: 'bad', password: 'secret' }, true).subscribe({
      error: (err) => error = err,
    });

    httpMock.expectOne('/api/auth/login').flush({ token: jwt({ sub: 'bad', rol: 'ROLE_USER', exp: futureExp }) });

    expect(error?.message).toContain('inv');
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('sends super admins to the global dashboard as landing route', () => {
    const service = configure(jwt({ sub: 'root', rol: 'ROLE_SUPER_ADMIN', exp: futureExp }));

    expect(service.hasAnyRole(['ROLE_SUPER_ADMIN'])).toBeTrue();
    expect(service.landingRoute()).toBe('/dashboard/super-admin');

    tenantContext.selectCompany({ id: 6 } as any);

    expect(service.landingRoute()).toBe('/dashboard/super-admin');
  });

  it('logs out and redirects by default', () => {
    const service = configure(jwt({ sub: 'user', rol: 'ROLE_USER', empresaId: 3, exp: futureExp }));

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('route guards', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'hasAnyRole',
      'landingRoute',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('authGuard allows authenticated users', () => {
    auth.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/perfil' } as RouterStateSnapshot)
    );

    expect(result).toBeTrue();
  });

  it('authGuard redirects unauthenticated users to login with returnUrl', () => {
    auth.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/perfil' } as RouterStateSnapshot)
    );

    expect(router.serializeUrl(result as any)).toBe('/login?returnUrl=%2Fperfil');
  });

  it('roleGuard redirects authenticated users without a required role', () => {
    auth.isAuthenticated.and.returnValue(true);
    auth.hasAnyRole.and.returnValue(false);
    auth.landingRoute.and.returnValue('/dashboard/admin');

    const route = { data: { roles: ['ROLE_SUPER_ADMIN'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as RouterStateSnapshot));

    expect(router.serializeUrl(result as any)).toBe('/dashboard/admin');
  });
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;
  let tokenStorage: jasmine.SpyObj<TokenStorageService>;
  let tenantContext: jasmine.SpyObj<TenantContextService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['companyId', 'logout']);
    tokenStorage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', ['getToken']);
    tenantContext = jasmine.createSpyObj<TenantContextService>('TenantContextService', [], {
      companyId: 12,
    });
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    auth.companyId.and.returnValue(6);
    tokenStorage.getToken.and.returnValue('jwt-token');
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: TenantContextService, useValue: tenantContext },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds authorization and selected tenant headers', () => {
    http.get('/api/clientes').subscribe();

    const request = httpMock.expectOne('/api/clientes');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    expect(request.request.headers.get('X-Tenant-ID')).toBe('12');
    request.flush([]);
  });

  it('logs out once on protected 401 responses', () => {
    http.get('/api/clientes').subscribe({ error: () => undefined });

    const request = httpMock.expectOne('/api/clientes');
    request.flush({ message: 'No autenticado' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalledWith(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not logout when optional logo requests return 401', () => {
    http.get('/api/empresas/6/logo').subscribe({ error: () => undefined });

    const request = httpMock.expectOne('/api/empresas/6/logo');
    request.flush({ message: 'No autenticado' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
