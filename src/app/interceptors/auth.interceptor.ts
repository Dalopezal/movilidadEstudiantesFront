import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return this.auth.getAccessTokenAsync().pipe(
      switchMap(token => {
        const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
        return next.handle(authReq);
      })
    );
  }
}
