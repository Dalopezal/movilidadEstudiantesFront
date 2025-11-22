import { Component, OnInit, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from '../../services/auth.service';

declare const google: any;

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
    private msalService: MsalService,
    private auth: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadGoogleScript().then(() => {
        this.initializeGoogleSignIn();
      });
    }

    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.guardarUsuario(account);
      this.router.navigate(['/home']);
    }
  }

  private guardarUsuario(account: any) {
    try {
      const storedRaw = localStorage.getItem('usuario');
      const stored = storedRaw ? JSON.parse(storedRaw) : {};

      const usuario = {
        ...stored,
        correo: account.username,
        nombre: account.name,
        tipo: 'microsoft'
      };

      localStorage.setItem('usuario', JSON.stringify(usuario));
      localStorage.removeItem('auth_token');

      // Notificar cambios
      window.dispatchEvent(new CustomEvent('usuario:changed', { detail: usuario }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Error guardando usuario en LoginComponent', e);
    }
  }

  loginWithMicrosoft() {
    this.msalService.loginRedirect({
      scopes: ['user.read']
    });
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      //client_id: '462807364747-ck4b0a6j1hfhf648aqid7gv8dvvj2rqt.apps.googleusercontent.com',
      client_id: '399159101800-stm3ke3chlvtscr9mkde7rli01ao621q.apps.googleusercontent.com',
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

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Error decodificando token', e);
      return null;
    }
  }

  handleCredentialResponse(response: any) {
    this.loading = true;
    this.mensaje = '';

    const userData = this.decodeToken(response.credential);

    if (userData) {
      this.auth.setGoogleCredential(response.credential);

      localStorage.setItem('usuario', JSON.stringify({
        correo: userData.email,
        nombre: userData.name,
        foto: userData.picture?.trim(),
        rolId: "",
        rol: "",
        tipo: "google",
        tieneDatos: false,
      }));
    }

      this.loading = false;
      this.router.navigate(['/home']);

    // this.ngZone.run(() => {
    //   setTimeout(() => {
    //     this.loading = false;
    //     this.router.navigate(['/home']);
    //   }, 1500);
    // });
  }
}
