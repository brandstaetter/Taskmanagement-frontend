import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  createNewUserApiV1AdminUsersPost,
  resetPasswordApiV1AdminUsersUserIdResetPasswordPost,
  initDbApiV1AdminDbInitPost,
  runMigrationsApiV1AdminDbMigratePost,
  PasswordResetResponse,
  User,
  AdminUserCreate,
} from '../generated';
import { createClient, createConfig, type Client } from '../generated/client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.baseUrl;
  private authenticatedClient: Client;

  constructor(private authService: AuthService) {
    // Create a base client
    this.authenticatedClient = createClient(
      createConfig({
        baseUrl: this.baseUrl,
      })
    );
  }

  private getAuthSecurity() {
    const token = this.authService.getAccessToken();
    return token ? [{ scheme: 'bearer' as const, type: 'http' as const }] : undefined;
  }

  private handleApiResponse<T>(response: { data?: T; error?: unknown; response: Response }): T {
    if (response.error) {
      throw response.error;
    }
    return response.data as T;
  }

  createUser(user: AdminUserCreate): Observable<User> {
    return from(
      createNewUserApiV1AdminUsersPost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        body: user,
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  resetUserPassword(userId: number): Observable<PasswordResetResponse> {
    return from(
      resetPasswordApiV1AdminUsersUserIdResetPasswordPost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { user_id: userId },
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  initDatabase(): Observable<{ message: string }> {
    return from(
      initDbApiV1AdminDbInitPost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  migrateDatabase(): Observable<{ message: string }> {
    return from(
      runMigrationsApiV1AdminDbMigratePost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }
}
