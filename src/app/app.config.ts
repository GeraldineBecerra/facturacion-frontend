import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { ReloadRouteReuseStrategy } from './core/routing/reload-route-reuse.strategy';

registerLocaleData(localeEsCL);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: RouteReuseStrategy, useExisting: ReloadRouteReuseStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CL' },
  ],
};
