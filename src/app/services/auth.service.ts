import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { decodeJwt } from '../utils/jwt.util';

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
  private readonly userStorageKey = 'taskman_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.userStorageKey);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  private setStoredUser(user: User): void {
    try {
      localStorage.setItem(this.userStorageKey, JSON.stringify(user));
      this.currentUserSubject.next(user);
    } catch (e) {
      console.error('Failed to store user in localStorage:', e);
    }
  }

  private extractUserFromToken(token: string): void {
    const payload = decodeJwt(token);
    if (payload) {
      // user_id might not be in the token, we'll use 0 as placeholder
      // The real ID should come from a proper user profile endpoint
      const user: User = {
        id: payload.user_id ?? 0,
        email: payload.sub,
        is_active: true,
        is_admin: payload.is_admin ?? false,
        avatar_url: null,
        last_login: null,
        // These timestamps are placeholders since they're not in the JWT
        // In a real app, they should come from a /users/me endpoint
        created_at: new Date(payload.iat ? payload.iat * 1000 : Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.setStoredUser(user);
    }
  }

  private clearStoredUser(): void {
    try {
      localStorage.removeItem(this.userStorageKey);
      this.currentUserSubject.next(null);
    } catch (e) {
      console.error('Failed to clear user from localStorage:', e);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.is_admin ?? false;
  }

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
    } catch (e) {
      console.error('Failed to set access token in localStorage:', e);
    }
  }

  clearAccessToken(): void {
    try {
      localStorage.removeItem(this.tokenStorageKey);
    } catch (e) {
      console.error('Failed to clear access token from localStorage:', e);
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    const body = new HttpParams().set('username', username).set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/user/token`, body.toString(), {
        headers,
      })
      .pipe(
        tap((response: AuthResponse) => {
          if (response?.access_token) {
            this.setAccessToken(response.access_token);
            this.extractUserFromToken(response.access_token);
          }
        })
      );
  }

  logout(): void {
    this.clearAccessToken();
    this.clearStoredUser();
  }
}
