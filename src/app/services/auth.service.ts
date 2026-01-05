import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  loginUserForAccessTokenApiV1AuthUserTokenPost,
  getCurrentUserInfoApiV1UsersMeGet,
  Token,
  User,
} from '../generated';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenStorageKey = 'taskman_access_token';
  private readonly userStorageKey = 'taskman_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

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

  private fetchCurrentUser(): Observable<User> {
    return from(
      getCurrentUserInfoApiV1UsersMeGet({
        baseUrl: environment.baseUrl,
      })
    ).pipe(
      map(response => response.data as User),
      tap((user: User) => {
        this.setStoredUser(user);
      })
    );
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

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.is_superadmin ?? false;
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

  login(username: string, password: string): Observable<Token> {
    return from(
      loginUserForAccessTokenApiV1AuthUserTokenPost({
        baseUrl: environment.baseUrl,
        body: {
          username,
          password,
          grant_type: 'password',
        },
      })
    ).pipe(
      map(response => response.data as Token),
      tap((response: Token) => {
        if (response?.access_token) {
          this.setAccessToken(response.access_token);
          this.fetchCurrentUser().subscribe();
        }
      })
    );
  }

  logout(): void {
    this.clearAccessToken();
    this.clearStoredUser();
  }
}
