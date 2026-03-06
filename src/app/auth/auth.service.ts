import {inject, Injectable} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {authConfig} from './auth.config';
import {UserControllerService} from '../api/user-service';

@Injectable({
  providedIn: 'root'
})
export class AuthService{

  // oauthService = inject(OAuthService);
  userController = inject(UserControllerService);

  constructor(private oauthService: OAuthService) {
  }

  async initAuth(): Promise<void>{
    this.oauthService.configure(authConfig);
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();
    this.oauthService.setupAutomaticSilentRefresh()

    if (this.isLoggedIn) {
      this.userController.checkKeycloakAndCreateUser(this.userProfile['sub']).subscribe();
    }
  }

  login(){
    this.oauthService.initCodeFlow();
    // this.userController.checkKeycloakAndCreateUser(this.userProfile['sub'])
    //   .subscribe();
  }

  register(): void {
    const issuer = this.oauthService.issuer;
    const redirectUri = encodeURIComponent(window.location.origin + '/');
    window.location.href =
      `${issuer}/protocol/openid-connect/registrations` +
      `?client_id=angular&response_type=code&redirect_uri=${redirectUri}`;
  }

  logout(){
    // this.oauthService.logOut();
    this.oauthService.revokeTokenAndLogout();
  }

  get accessToken(): string{
    return this.oauthService.getAccessToken();
  }

  get userProfile(){
    return this.oauthService.getIdentityClaims();
  }

  get isLoggedIn(): boolean{
    return this.oauthService.hasValidAccessToken();
  }
}
