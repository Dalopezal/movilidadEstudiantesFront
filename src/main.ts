import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

import { MsalService, MSAL_INSTANCE } from '@azure/msal-angular';
import { PublicClientApplication } from '@azure/msal-browser';

//Crear instancia MSAL
const pca = new PublicClientApplication({
  auth: {
    clientId: '31c32eb6-567f-4337-a7e9-577dc78a0bb9',
    authority: 'https://login.microsoftonline.com/c7ece3f9-5868-427d-a77f-e50bf0690a34',
    redirectUri: 'http://localhost:4200'
    //redirectUri: 'https://ucminternacionaldev.ucm.edu.co/'
  }
});

// Registrar interceptor
import { AuthInterceptor } from './app/interceptors/auth.interceptor';

(async () => {
  try {
    // Inicializar MSAL
    await pca.initialize();

    // Procesar redirect pendiente (si hay)
    const response = await pca.handleRedirectPromise();
    if (response && response.account) {
    pca.setActiveAccount(response.account);

    try {
      const storedRaw = localStorage.getItem('usuario');
      const stored = storedRaw ? JSON.parse(storedRaw) : {};

      const mergedUsuario = {
        ...stored,
        correo: response.account.username,
        nombre: response.account.name,
        tipo: 'microsoft'
      };

      localStorage.setItem('usuario', JSON.stringify(mergedUsuario));

      window.dispatchEvent(new CustomEvent('usuario:changed', { detail: mergedUsuario }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('No se pudo mergear/guardar usuario tras redirect MSAL', e);
    }
  }

    // Bootstrap de la app
    await bootstrapApplication(AppComponent, {
      providers: [
        importProvidersFrom(
          HttpClientModule,
          RouterModule.forRoot(routes)
        ),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
        providePrimeNG({ theme: { preset: Lara } }),

        { provide: MSAL_INSTANCE, useValue: pca },
        MsalService,

        // Registrar interceptor
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
      ]
    });

  } catch (err) {
    console.error('Error inicializando MSAL / bootstrap:', err);
  }
})();
