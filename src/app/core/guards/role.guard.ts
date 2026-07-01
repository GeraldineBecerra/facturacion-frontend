import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRole } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] ?? []) as AppRole[];

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return roles.length === 0 || auth.hasAnyRole(roles)
    ? true
    : router.parseUrl(auth.landingRoute());
};
