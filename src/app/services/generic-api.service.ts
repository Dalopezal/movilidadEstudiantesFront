// src/app/services/generic-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
    return this.http.delete<ApiResponse<T>>(url, this.buildOptions(undefined, options))
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
