import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const redirectIfAuthenticatedGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si está autenticado, redirige a /home; si no, permite acceder a la ruta (true)
  return auth.isAuthenticated$.pipe(
    map(isAuth => isAuth ? router.parseUrl('/home') : true)
  );
};
