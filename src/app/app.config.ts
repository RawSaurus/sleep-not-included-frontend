import {
  ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {initAuth} from './auth/auth.init';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './auth/auth.interceptor';
import {OAuthService, provideOAuthClient} from 'angular-oauth2-oidc';
import {AuthService} from './auth/auth.service';
import {Configuration} from './api/build-service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideOAuthClient(),
    provideRouter(routes),
    provideAppInitializer(() =>
      inject(AuthService).initAuth()),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};
