// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';

import { MsalService, MSAL_INSTANCE } from '@azure/msal-angular';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';

// 🔑 Crear instancia
const pca = new PublicClientApplication({
  auth: {
    clientId: '31c32eb6-567f-4337-a7e9-577dc78a0bb9',
    authority: 'https://login.microsoftonline.com/c7ece3f9-5868-427d-a77f-e50bf0690a34',
    redirectUri: 'http://localhost:4200'
    //redirectUri: 'https://ucminternacionaldev.ucm.edu.co/'
  }
});

// 🚀 OBLIGATORIO: Inicializar antes de usar
pca.initialize().then(() => {
  // Procesar cualquier redirect pendiente
  pca.handleRedirectPromise().then((response) => {
    if (response && response.account) {
      pca.setActiveAccount(response.account);
    }
  });

  // Ahora sí bootstrapping Angular
  bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom(
        HttpClientModule,
        RouterModule.forRoot(routes)
      ),
      provideHttpClient(withInterceptorsFromDi()),
      provideAnimations(),
      providePrimeNG({
        theme: { preset: Lara }
      }),
      {
        provide: MSAL_INSTANCE,
        useValue: pca // 👈 instancia ya inicializada
      },
      MsalService
    ]
  }).catch(err => console.error('Bootstrap error:', err));
});
