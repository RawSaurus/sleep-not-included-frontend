import {inject} from '@angular/core';
import {AuthService} from './auth.service';
import {OAuthService} from 'angular-oauth2-oidc';
import {authConfig} from './auth.config';

// export function initAuth(authService: OAuthService) {
//   return () => authService.initAuth();
// }

// export function initAuth() {
//   return async () => {
//     const oauthService = inject(OAuthService);
//
//     oauthService.configure(authConfig);
//     await oauthService.loadDiscoveryDocumentAndTryLogin();
//     oauthService.setupAutomaticSilentRefresh();
//   };
// }

export function initAuth(oauthService: OAuthService) {
  return async () => {
    oauthService.configure(authConfig);
    await oauthService.loadDiscoveryDocumentAndTryLogin();
    oauthService.setupAutomaticSilentRefresh();
  };
}
