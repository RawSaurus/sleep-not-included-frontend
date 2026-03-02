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
import {Configuration as BuildConfiguration} from './api/build-service';
import {Configuration as UserConfiguration} from './api/user-service';
import {Configuration as CommentConfiguration} from './api/comment-service';
import {Configuration as TagConfiguration} from './api/tag-service';
import {Configuration as GameresConfiguration} from './api/gameres-service';
import {Configuration as ImageConfiguration} from './api/image-service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideOAuthClient(),
    provideRouter(routes),
    provideAppInitializer(() =>
      inject(AuthService).initAuth()),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: UserConfiguration,
      useFactory: () => new UserConfiguration({
        basePath: 'http://localhost:8080',
      })
    },
    {
      provide: BuildConfiguration,
      useFactory: () => new BuildConfiguration({
        basePath: 'http://localhost:8080',
      })
    },
    {
      provide: CommentConfiguration,
      useFactory: () => new CommentConfiguration({
        basePath: 'http://localhost:8080',
      })
    },
    {
      provide: TagConfiguration,
      useFactory: () => new TagConfiguration({
        basePath: 'http://localhost:8080',
      })
    },
    {
      provide: GameresConfiguration,
      useFactory: () => new GameresConfiguration({
        basePath: 'http://localhost:8080',
      })
    },
    {
      provide: ImageConfiguration,
      useFactory: () => new ImageConfiguration({
        basePath: 'http://localhost:8080',
      })
    },
  ]
};
