import {AuthService} from './auth.service';
import {inject} from '@angular/core';
import {HttpHandlerFn, HttpRequest} from '@angular/common/http';

export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn){
  const authService = inject(AuthService);
  const token = authService.accessToken;
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
