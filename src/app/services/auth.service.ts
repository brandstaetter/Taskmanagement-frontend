import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/v1`;
  private readonly tokenStorageKey = 'taskman_access_token';

  constructor(private http: HttpClient) {}

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.tokenStorageKey);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  }

  setAccessToken(token: string): void {
    try {
      localStorage.setItem(this.tokenStorageKey, token);
    } catch {
      void 0;
    }
  }

  clearAccessToken(): void {
    try {
      localStorage.removeItem(this.tokenStorageKey);
    } catch {
      void 0;
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    const body = new HttpParams().set('username', username).set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/token`, body.toString(), {
        headers,
      })
      .pipe(
        tap((response: AuthResponse) => {
          if (response?.access_token) {
            this.setAccessToken(response.access_token);
          }
        })
      );
  }

  logout(): void {
    this.clearAccessToken();
  }
}
