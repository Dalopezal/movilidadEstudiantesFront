import { Component, OnInit, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadGoogleScript().then(() => {
        this.initializeGoogleSignIn();
      });
    }
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
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

  handleCredentialResponse(response: any) {
    this.loading = true;
    this.mensaje = '';

    this.ngZone.run(() => {
      setTimeout(() => {
        this.loading = false;
        this.router.navigate(['/home']);
      }, 1500);
    });
  }
}
