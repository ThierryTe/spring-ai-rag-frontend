import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { demoSessionInterceptor } from './core/http/demo-session.interceptor';
import { errorMappingInterceptor } from './core/http/error-mapping.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([demoSessionInterceptor, authInterceptor, errorMappingInterceptor]),
    ),
  ],
};
