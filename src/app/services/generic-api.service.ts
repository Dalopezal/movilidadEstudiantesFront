// src/app/services/generic-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: number;
}

@Injectable({
  providedIn: 'any' // mantiene la compatibilidad con standalone components
})
export class GenericApiService {
  private externalBaseUrl = 'https://integracionesucmdev.ucm.edu.co/api/';

  constructor(private http: HttpClient) {}

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

    return {
      params: httpParams,
      responseType: 'json' as const,
      observe: 'body' as const,
      headers: (extraOptions && extraOptions.headers) || undefined,
      // withCredentials: extraOptions?.withCredentials ?? false, // activar si usas cookies de sesión
      ...extraOptions
    };
  }

  get<T>(endpoint: string, params?: any, options?: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.get<ApiResponse<T>>(url, this.buildOptions(params, options))
      .pipe(
        map((res: ApiResponse<T> | any) => this.extractData(res)),
        catchError(err => this.handleError(err))
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
      console.log('TOKEN REUSADO:', storedToken);
      return from(Promise.resolve(storedToken));
    }

    const body = {
      username: 'sigdi',
      password: 'Be,l2Z^*T548'
    };

    const url = `${environment.apiUrlExterna}/orisiga/token/`;

    return this.http.post<any>(url, body).pipe(
      map(res => {
        console.log('RESPUESTA TOKEN:', res);

        const token = res?.access as string;   // <- este campo
        if (!token) {
          throw new Error('No se recibió token.access válido del servicio externo');
        }

        console.log('TOKEN NUEVO (access):', token);

        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 50);

        localStorage.setItem('external_token', token);
        localStorage.setItem('external_token_expiry', expires.toISOString());

        return token;
      }),
      catchError(err => {
        console.error('Error obteniendo token externo', err);
        return throwError(() => err);
      })
    );
  }

  private buildUrlExterno(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const baseUrlExterna = environment.apiUrlExterna; // '/api-orisiga'
    const e = endpoint.replace(/^\//, '');
    // Resultado: /api-orisiga/orisiga/asignaciondocente/?...
    return `${baseUrlExterna}/${e}`;
  }

  getExterno<T>(endpoint: string, params?: any, options?: any): Observable<T> {
    return this.getExternalToken().pipe(
      switchMap(token => {
        const url = this.buildUrlExterno(endpoint);

        let headers = new HttpHeaders({
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MzkzMzQ4LCJpYXQiOjE3NjM3ODg1NDgsImp0aSI6IjcyYWQ0MjE5YWQ1NzQ2YTQ4YzEyNzlmYTlmZjI0OWJmIiwidXNlcl9pZCI6IjIifQ._7j3_aVo_1RzEl1sbQ1ejxbCDi1ImJ5buwFdlB2z3aI`
        });

        if (options?.headers) {
          headers = options.headers.set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0MzkzMzQ4LCJpYXQiOjE3NjM3ODg1NDgsImp0aSI6IjcyYWQ0MjE5YWQ1NzQ2YTQ4YzEyNzlmYTlmZjI0OWJmIiwidXNlcl9pZCI6IjIifQ._7j3_aVo_1RzEl1sbQ1ejxbCDi1ImJ5buwFdlB2z3aI`);
        }

        console.log('URL EXTERNA:', url);
        console.log('HEADER AUTH:', headers.get('Authorization'));

        const httpOptions = {
          ...this.buildOptions(params, options),
          headers,
          responseType: 'text' as const,
          observe: 'body' as const
        };

        return this.http.get<any>(url, httpOptions).pipe(
          map((res: any) => {
            try {
              return this.extractData(JSON.parse(res)) as T;
            } catch {
              return res as T;
            }
          }),
          catchError(err => this.handleError(err))
        );
      })
    );
  }

  post<T>(endpoint: string, body: any, options?: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.post<ApiResponse<T>>(url, body, this.buildOptions(undefined, options))
      .pipe(
        map((res: ApiResponse<T> | any) => this.extractData(res)),
        catchError(err => this.handleError(err))
      );
  }

  put<T>(endpoint: string, body: any, options?: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.put<ApiResponse<T>>(url, body, this.buildOptions(undefined, options))
      .pipe(
        map((res: ApiResponse<T> | any) => this.extractData(res)),
        catchError(err => this.handleError(err))
      );
  }

  delete<T>(endpoint: string, options?: any): Observable<T> {
    const url = this.buildUrl(endpoint);
    return this.http.patch<ApiResponse<T>>(url, this.buildOptions(undefined, options))
      .pipe(
        map((res: ApiResponse<T> | any) => this.extractData(res)),
        catchError(err => this.handleError(err))
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
