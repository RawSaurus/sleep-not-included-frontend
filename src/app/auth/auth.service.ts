import {inject, Injectable} from '@angular/core';
import {OAuthService} from 'angular-oauth2-oidc';
import {authConfig} from './auth.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService{

  // oauthService = inject(OAuthService);

  constructor(private oauthService: OAuthService) {
  }

  async initAuth(): Promise<void>{
    this.oauthService.configure(authConfig);
    await this.oauthService.loadDiscoveryDocumentAndTryLogin();

    if(!this.oauthService.hasValidAccessToken()){
      this.login();
    }

    this.oauthService.setupAutomaticSilentRefresh()
  }

  login(){
    this.oauthService.initCodeFlow();
  }

  logout(){
    this.oauthService.logOut();
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
