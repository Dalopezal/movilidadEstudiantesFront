import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { switchMap } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private msal: MsalService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const url = req.url.toLowerCase();

    // Rutas que requieren token de Azure AD
    const protectedRoutes = [
      '/api/protegida', // ajusta según tus rutas protegidas
      '/secure'
    ];

    const isProtected = protectedRoutes.some(route => url.includes(route));

    if (!isProtected) {
      // No inyectar token de Azure AD
      return next.handle(req);
    }

    // Solo para rutas protegidas, obtener e inyectar token
    return this.msal.acquireTokenSilent({
      scopes: ['user.read'] // ajusta según los scopes requeridos
    }).pipe(
      switchMap(response => {
        const token = response.accessToken;
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next.handle(authReq);
      })
    );
  }
}
