// src/app/services/generic-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: number;
}

@Injectable({
  providedIn: 'any'
})
export class GenericApiService {

  constructor(private http: HttpClient) {}

  // -----------------------
  // TOKEN INTERNO (AUTO-RECOVERY SIN REFRESH) - NUEVO
  // -----------------------
  private internalRecoveryInFlight$?: Observable<string>;

  private isAuthError(err: any): boolean {
    return err instanceof HttpErrorResponse && (err.status === 401 || err.status === 403);
  }

  private getInternalAccessToken(): string | null {
    return sessionStorage.getItem('generalToken') || localStorage.getItem('generalToken');
  }

  private setInternalAccessToken(token: string) {
    sessionStorage.setItem('generalToken', token);
    localStorage.setItem('generalToken', token);
  }

  private clearInternalAccessToken() {
    sessionStorage.removeItem('generalToken');
    localStorage.removeItem('generalToken');
  }

  private recoverInternalToken(): Observable<string> {

    const ctxStr = sessionStorage.getItem('auth_context');
    if (!ctxStr) {
      this.clearInternalAccessToken();
      return throwError(() => new Error('No hay contexto de autenticación para regenerar token.'));
    }

    let ctx: any;
    try {
      ctx = JSON.parse(ctxStr);
    } catch {
      this.clearInternalAccessToken();
      return throwError(() => new Error('Contexto de autenticación inválido.'));
    }

    const loginUrl = this.buildUrl('Usuarios/Iniciar_Sesion');

    return this.http.post<any>(loginUrl, ctx).pipe(
      map(res => {
        if (res?.exito && res?.datos) {
          return String(res.datos);
        }
        throw new Error('No se pudo regenerar el token.');
      }),
      tap(token => sessionStorage.setItem('generalToken', token))
    );
  }

  /**
   * Wrapper para requests INTERNOS: si 401/403 => intenta recuperar token => retry 1 vez.
   */
  private requestInternalWithAutoRecovery<T>(requestFactory: () => Observable<ApiResponse<T> | any>): Observable<T> {
    return requestFactory().pipe(
      map((res: ApiResponse<T> | any) => this.extractData(res)),
      catchError(err => {
        if (this.isAuthError(err)) {
          return this.recoverInternalToken().pipe(
            switchMap(() =>
              requestFactory().pipe(
                map((res: ApiResponse<T> | any) => this.extractData(res))
              )
            ),
            catchError(err2 => this.handleError(err2))
          );
        }
        return this.handleError(err);
      })
    );
  }

  private buildUrl(endpoint: string) {
    // Si ya es una URL completa, retornarla tal cual
    if (/^https?:\/\//i.test(endpoint)) return endpoint;
    const base = (environment.apiUrl ?? '').replace(/\/$/, '');
    const e = endpoint.replace(/^\//, '');
    return base ? `${base}/${e}` : `/${e}`;
  }

  private buildOptions(params?: any, extraOptions?: any) {
    let httpParams = new HttpParams();
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(k => {
        const val = params[k];
        if (val !== undefined && val !== null) {
          httpParams = httpParams.set(k, String(val));
        }
      });
    }

    // Obtener token interno desde sessionStorage o localStorage
    const internalToken = sessionStorage.getItem('generalToken') || localStorage.getItem('generalToken');

    let headers = (extraOptions?.headers as HttpHeaders) || new HttpHeaders();

    // Si hay token interno, agregarlo al header
    if (internalToken) {
      headers = headers.set('Authorization', `Bearer ${internalToken}`);
    }

    return {
      params: httpParams,
      responseType: 'json' as const,
      observe: 'body' as const,
      headers,
      ...extraOptions
    };
  }

  get<T>(endpoint: string, params?: any, options?: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    const ctxStr = sessionStorage.getItem('auth_context');
    return this.requestInternalWithAutoRecovery<T>(() =>
      this.http.get<ApiResponse<T>>(url, this.buildOptions(params, options))
    );
  }

  // -----------------------
  // TOKEN EXTERNO
  // -----------------------
  // -----------------------
  private getExternalToken(): Observable<string> {
    const storedToken = localStorage.getItem('external_token');
    const storedExpiry = localStorage.getItem('external_token_expiry');

    if (storedToken && storedExpiry && new Date(storedExpiry) > new Date()) {
      return from(Promise.resolve(storedToken));
    }

    const body = {
      username: 'sigdi',
      password: 'Be,l2Z^*T548'
    };

    // FIX: Usar la URL correcta con el proxy
    const url = `${environment.apiUrlExterna}/orisiga/token/`;
    //const url = `https://integracionesucmdev.ucm.edu.co/api/orisiga/token/`;

    return this.http.post<any>(url, body).pipe(
      map(res => {

        const token = res?.access as string;
        if (!token) {
          console.error('Estructura de respuesta:', res);
          throw new Error('No se recibió token.access válido del servicio externo');
        }

        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 50);

        localStorage.setItem('external_token', token);
        localStorage.setItem('external_token_expiry', expires.toISOString());

        return token;
      }),
      catchError(err => {
        console.error('Error obteniendo token externo:', err);
        return throwError(() => err);
      })
    );
  }

  private buildUrlExterno(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const baseUrlExterna = environment.apiUrlExterna; // '/api-orisiga'
    //const baseUrlExterna = `https://integracionesucmdev.ucm.edu.co/api`;
    const e = endpoint.replace(/^\//, '');
    return `${baseUrlExterna}/${e}`;
  }

  getExterno<T>(endpoint: string, params?: any, options?: any): Observable<T> {
    return this.getExternalToken().pipe(
      switchMap(token => {
        const url = this.buildUrlExterno(endpoint);

        let headers = (options?.headers as HttpHeaders) || new HttpHeaders();
        headers = headers.set('Authorization', `Bearer ${token}`);

        const httpOptions = {
          ...this.buildOptions(params, options),
          headers,
          responseType: 'json' as const,
          observe: 'body' as const
        };

        return this.http.get<any>(url, httpOptions).pipe(
          map((res: any) => this.extractData(res) as T),
          catchError(err => this.handleError(err))
        );
      })
    );
  }

  post<T>(endpoint: string, body: any, options?: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.requestInternalWithAutoRecovery<T>(() =>
      this.http.post<ApiResponse<T>>(url, body, this.buildOptions(undefined, options))
    );
  }

  postExterno<T>(endpoint: string, body: any, options?: any): Observable<T> {
    return this.getExternalToken().pipe(
      switchMap(token => {
        const url = this.buildUrlExterno(endpoint);

        let headers = (options?.headers as HttpHeaders) || new HttpHeaders();
        headers = headers.set('Authorization', `Bearer ${token}`);

        const httpOptions = {
          ...this.buildOptions(undefined, options),
          headers,
          responseType: 'json' as const,
          observe: 'body' as const
        };

        return this.http.post<any>(url, body, httpOptions).pipe(
          map((res: any) => this.extractData(res) as T),
          catchError(err => this.handleError(err))
        );
      })
    );
  }

  put<T>(endpoint: string, body: any, options?: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.requestInternalWithAutoRecovery<T>(() =>
      this.http.put<ApiResponse<T>>(url, body, this.buildOptions(undefined, options))
    );
  }

  delete<T>(endpoint: string, options?: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.requestInternalWithAutoRecovery<T>(() =>
      this.http.patch<ApiResponse<T>>(url, this.buildOptions(undefined, options))
    );
  }

  private extractData<T>(response: ApiResponse<T> | T): T {
    if (response && (response as any).data !== undefined) {
      return (response as any).data as T;
    }
    return response as T;
  }

  private handleError(error: HttpErrorResponse | any) {
    const hasErrorEvent = typeof ErrorEvent !== 'undefined' && error?.error instanceof ErrorEvent;
    let errorMsg = 'Ocurrió un error desconocido';

    if (hasErrorEvent) {
      errorMsg = `Error cliente: ${error.error?.message ?? 'Sin mensaje'}`;
    } else if (error instanceof HttpErrorResponse) {
      const status = error.status ?? 'desconocido';
      const statusText = error.statusText ?? '';
      const srvMsg = error.error?.message ?? error.message ?? '';
      errorMsg = `Error servidor: código ${status} ${statusText} ${srvMsg}`.trim();
    } else if (error?.message) {
      errorMsg = `Error: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }

    console.error('GenericApiService error:', error);
    return throwError(() => new Error(errorMsg));
  }
}
