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

    if(!this.oauthService.hasValidAccessToken()){
      this.login();
    }
    this.userController.checkKeycloakAndCreateUser(this.userProfile['sub'])
      .subscribe();

    this.oauthService.setupAutomaticSilentRefresh()
  }

  login(){
    this.oauthService.initCodeFlow();
    this.userController.checkKeycloakAndCreateUser(this.userProfile['sub'])
      .subscribe();
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
