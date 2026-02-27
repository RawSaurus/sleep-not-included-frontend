import {ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {initAuth} from './auth/auth.init';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './auth/auth.interceptor';
import {OAuthService} from 'angular-oauth2-oidc';
import {AuthService} from './auth/auth.service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // provideAppInitializer(() =>
    //   inject(AuthService).initAuth()),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
