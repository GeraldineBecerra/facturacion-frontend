import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AppRole, AuthResponse, JwtPayload, LoginRequest } from './auth.models';
import { TokenStorageService } from './token-storage.service';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly payloadState = signal<JwtPayload | null>(null);

  readonly payload = this.payloadState.asReadonly();
  readonly isAuthenticated = computed(() => {
    const payload = this.payloadState();
    return !!payload && payload.exp * 1000 > Date.now();
  });
  readonly role = computed(() => this.payloadState()?.rol ?? null);
  readonly username = computed(() => this.payloadState()?.sub ?? '');
  readonly companyId = computed(() => {
    const payload = this.payloadState();
    return payload?.empresaId ?? payload?.companyId ?? null;
  });
  readonly companyName = computed(() => {
    const payload = this.payloadState();
    return payload?.empresaNombre ?? payload?.companyName ?? payload?.razonSocial ?? null;
  });

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenStorage: TokenStorageService,
    private tenantContext: TenantContextService,
  ) {
    this.payloadState.set(this.readPayload());
  }

  login(request: LoginRequest, remember: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      map((response) => {
        const payload = this.decodeToken(response.token);
        if (!this.isValidPayload(payload)) {
          throw new Error('El servidor devolvió un token inválido.');
        }

        const token = response.token;
        this.tenantContext.clear();
        this.tokenStorage.setToken(token, remember);
        this.payloadState.set(payload);
        return response;
      }),
    );
  }

  logout(redirect = true): void {
    this.tokenStorage.clear();
    this.tenantContext.clear();
    this.payloadState.set(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const role = this.role();
    return !!role && roles.includes(role);
  }

  landingRoute(): string {
    switch (this.role()) {
      case 'ROLE_SUPER_ADMIN':
        return this.tenantContext.companyId ? '/facturacion' : '/seleccionar-empresa';
      case 'ROLE_ADMIN':
        return '/usuarios';
      default:
        return '/facturacion';
    }
  }

  private readPayload(): JwtPayload | null {
    const token = this.tokenStorage.getToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    if (!this.isValidPayload(payload)) {
      this.tokenStorage.clear();
      return null;
    }
    return payload;
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const payloadPart = token.split('.')[1];
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const json = decodeURIComponent(
        atob(normalized)
          .split('')
          .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join(''),
      );
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isValidPayload(payload: JwtPayload | null): payload is JwtPayload {
    if (!payload?.sub || !payload.rol || !payload.exp) return false;
    if (payload.exp * 1000 <= Date.now()) return false;

    const validRoles: AppRole[] = ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_USER'];
    if (!validRoles.includes(payload.rol)) return false;

    if (payload.rol === 'ROLE_SUPER_ADMIN') return true;

    const companyId = payload.empresaId ?? payload.companyId;
    return typeof companyId === 'number' && companyId > 0;
  }
}
