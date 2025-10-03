import { Component, OnInit, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MsalService } from '@azure/msal-angular';

declare const google: any; // Declaramos la variable global de Google

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  mensaje = '';
  loading = false;
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object,
    private msalService: MsalService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadGoogleScript().then(() => {
        this.initializeGoogleSignIn();
      });
    }

    // Procesar la respuesta de Microsoft
    this.msalService.instance.handleRedirectPromise().then(result => {
      if (result && result.account) {
        this.msalService.instance.setActiveAccount(result.account);
        this.guardarUsuario(result.account);

        this.ngZone.run(() => {
          this.loading = true;
          setTimeout(() => {
            this.loading = false;
            this.router.navigate(['/home']);
          }, 1500);
        });
      } else {
        // Si ya había un usuario activo, también lo rediriges
        const account = this.msalService.instance.getActiveAccount();
        if (account) {
          this.guardarUsuario(account);
          this.ngZone.run(() => {
            this.loading = true;
            setTimeout(() => {
              this.loading = false;
              this.router.navigate(['/home']);
            }, 1500);
          });
        }
      }
    });
  }

  private guardarUsuario(account: any) {
    console.log('Usuario Microsoft:', account);

    localStorage.setItem('usuario', JSON.stringify({
      correo: account.username,
      nombre: account.name,
      tipo: 'microsoft'
    }));
    localStorage.setItem('auth_token', JSON.stringify(this.msalService.instance.getActiveAccount()));
  }

  loginWithMicrosoft() {
    this.msalService.loginRedirect({
      scopes: ['user.read'] // pedir datos básicos del perfil
    });
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: '462807364747-ck4b0a6j1hfhf648aqid7gv8dvvj2rqt.apps.googleusercontent.com',
      //client_id: '399159101800-stm3ke3chlvtscr9mkde7rli01ao621q.apps.googleusercontent.com',
      callback: (response: any) => this.handleCredentialResponse(response)
    });

    google.accounts.id.renderButton(
      document.getElementById('googleSignInDiv'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  }

  loadGoogleScript(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isBrowser) {
        resolve();
        return;
      }
      const win: any = window;
      if (win.google && win.google.accounts && win.google.accounts.id) {
        resolve();
      } else {
        const interval = setInterval(() => {
          if (win.google && win.google.accounts && win.google.accounts.id) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  }

  // Función para decodificar un JWT
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Error decodificando token', e);
      return null;
    }
  }

  // Respuesta de Google al loguearse
  handleCredentialResponse(response: any) {
    this.loading = true;
    this.mensaje = '';

    // Decodificar JWT devuelto por Google
    const userData = this.decodeToken(response.credential);

    if (userData) {
      console.log('Usuario Google:', userData);

      // Guardamos datos en localStorage
      localStorage.setItem('auth_token', response.credential); // token completo
      localStorage.setItem('usuario', JSON.stringify({
        correo: userData.email,
        nombre: userData.name,
        foto: userData.picture.trim(),
        rolId: "",
        rol: "",
        tipo: "google",
        tieneDatos: false,

      }));
    }

    // Redirigir al home
    this.ngZone.run(() => {
      setTimeout(() => {
        this.loading = false;
        this.router.navigate(['/home']);
      }, 1500);
    });
  }
}
