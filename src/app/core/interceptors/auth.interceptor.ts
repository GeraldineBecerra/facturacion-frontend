import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TokenStorageService } from '../auth/token-storage.service';
import { TenantContextService } from '../tenant/tenant-context.service';

let handlingUnauthorized = false;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStorage = inject(TokenStorageService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const tenantContext = inject(TenantContextService);
  const token = tokenStorage.getToken();

  const headers: Record<string, string> = {};
  if (token && !request.headers.has('Authorization')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const companyId = tenantContext.companyId ?? auth.companyId();
  if (companyId && !request.headers.has('X-Tenant-ID')) {
    headers['X-Tenant-ID'] = String(companyId);
  }

  const authenticatedRequest = Object.keys(headers).length
    ? request.clone({ setHeaders: headers })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !request.url.includes('/auth/login') &&
        !isLogoRequest(request.url) &&
        !isDocumentDownloadRequest(request.url)
      ) {
        auth.logout(false);
        if (!handlingUnauthorized) {
          handlingUnauthorized = true;
          router.navigate(['/login']).finally(() => handlingUnauthorized = false);
        }
      }
      return throwError(() => error);
    }),
  );
};

function isLogoRequest(url: string): boolean {
  return /\/empresas\/\d+\/logo(?:$|\?)/.test(url);
}

function isDocumentDownloadRequest(url: string): boolean {
  return /\/documentos\/\d+\/(?:pdf|txt|xml|factura)(?:$|\?)/.test(url);
}
