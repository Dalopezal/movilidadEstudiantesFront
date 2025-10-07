import { Injectable } from '@angular/core';
import { BehaviorSubject, from, of, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult, AccountInfo } from '@azure/msal-browser';

declare global { interface Window { google: any; } }

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuth$ = new BehaviorSubject<boolean>(false);
  public readonly isAuthenticated$ = this.isAuth$.asObservable();

  private accessToken: string | null = null;
  private provider: 'ms' | 'google' | null = null;

  constructor(private msal: MsalService) {
    const acct = this.msal.instance.getActiveAccount();
    if (acct) {
      this.provider = 'ms';
      this.isAuth$.next(true);

      try {
        const storedRaw = localStorage.getItem('usuario');
        const stored = storedRaw ? JSON.parse(storedRaw) : {};

        const usuario = {
          ...stored, // conserva rolId, rol, tieneDatos, etc.
          correo: acct.username,
          nombre: acct.name,
          tipo: 'microsoft'
        };

        localStorage.setItem('usuario', JSON.stringify(usuario));

        // Notificar la app (mantener compatibilidad con tus listeners)
        window.dispatchEvent(new CustomEvent('usuario:changed', { detail: usuario }));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Error guardando usuario en AuthService', err);
      }

      // Obtener token y guardarlo si es posible
      this.acquireMsalToken(['user.read']).subscribe({
        next: (token) => {
          if (token) {
            localStorage.setItem('auth_token', token);
            this.accessToken = token;
          } else {
            localStorage.removeItem('auth_token');
          }
        },
        error: (err) => {
          console.error('Error obteniendo token MSAL en constructor:', err);
        }
      });
    }

    // Si ya había algo guardado (por Google u otro) también mantenemos estado
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken && !this.accessToken) {
      this.accessToken = this.parseTokenString(savedToken);
      if (!this.isAuth$.value) {
        this.isAuth$.next(true);
      }
    }
  }

  private parseTokenString(raw: string): string | null {
    try {
      const maybeJson = JSON.parse(raw);
      if (typeof maybeJson === 'string') return maybeJson;
      return null;
    } catch {
      return raw;
    }
  }

  // ---------- Microsoft ----------
  loginWithMsalRedirect(scopes: string[] = ['user.read']): void {
    this.msal.instance.loginRedirect({ scopes });
  }

  async loginWithMsalPopup(scopes: string[] = ['user.read']): Promise<void> {
    try {
      const res = await this.msal.instance.loginPopup({ scopes }) as AuthenticationResult;
      if (res?.account) {
        this.msal.instance.setActiveAccount(res.account as AccountInfo);
        this.provider = 'ms';
        this.isAuth$.next(true);
        localStorage.setItem('usuario', JSON.stringify({
          correo: res.account?.username,
          nombre: res.account?.name,
          tipo: 'microsoft'
        }));
      }
    } catch (err) {
      console.error('MSAL popup login error', err);
    }
  }

  /**
   * Devuelve Observable<string | null> con el access token para los scopes solicitados.
   * Intenta acquireTokenSilent (Promise -> from), y si falla intenta acquireTokenPopup.
   */
  acquireMsalToken(scopes: string[] = ['user.read']): Observable<string | null> {
    return from(this.msal.instance.acquireTokenSilent({ scopes })).pipe(
      map((res: AuthenticationResult) => {
        const token = res?.accessToken ?? null;
        this.accessToken = token;
        return token;
      }),
      catchError(() => {
        // fallback a popup
        return from(this.msal.instance.acquireTokenPopup({ scopes })).pipe(
          map((res: AuthenticationResult) => {
            const token = res?.accessToken ?? null;
            this.accessToken = token;
            return token;
          }),
          catchError((err) => {
            console.error('acquireTokenPopup failed', err);
            return of(null);
          })
        );
      })
    );
  }

  // ---------- Google Identity Services ----------
  initGoogle(clientId: string): void {
    if (!window?.google?.accounts?.id) {
      console.warn('GSI no cargado aún');
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        if (response?.credential) {
          this.setGoogleCredential(response.credential);
        }
      }
    });
  }

  // Establece token Google y marca autenticado
  setGoogleCredential(idToken: string) {
    this.provider = 'google';
    this.accessToken = idToken;
    this.isAuth$.next(true);
    localStorage.setItem('auth_token', idToken);
  }

  promptGoogleSignIn() {
    if (!window?.google?.accounts?.id) {
      console.warn('GSI no cargado');
      return;
    }
    window.google.accounts.id.prompt();
  }

  // ---------- Comunes ----------
  logout(): void {
    if (this.provider === 'ms') {
      this.msal.instance.logoutRedirect();
    } else if (this.provider === 'google') {
      if (window?.google?.accounts?.id) window.google.accounts.id.disableAutoSelect();
    }
    this.accessToken = null;
    this.provider = null;
    this.isAuth$.next(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('usuario');
  }

  isAuthenticated(): boolean {
    return this.isAuth$.getValue();
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getProvider(): 'ms' | 'google' | null {
    return this.provider;
  }

  // Devuelve Observable<string|null> (para interceptor) que obtiene token renovado para MS o devuelve token local para Google
  getAccessTokenAsync(scopes: string[] = ['user.read']): Observable<string | null> {
    if (this.provider === 'ms') {
      return this.acquireMsalToken(scopes);
    }
    return of(this.accessToken);
  }
}
