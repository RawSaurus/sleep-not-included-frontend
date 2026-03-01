import {AuthService} from './auth.service';
import {inject} from '@angular/core';
import {HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {OAuthService} from 'angular-oauth2-oidc';

export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn){
  const authService = inject(OAuthService);
  const token = authService.getAccessToken();
  if(token){
    const req = request.clone({
      headers: request.headers.set(
        'Authorization',
        'Bearer ' + token
      )
    });
    return next(req);
  }
  return next(request);
}
