import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  createNewUserApiV1AdminUsersPost,
  listUsersApiV1AdminUsersGet,
  removeUserApiV1AdminUsersUserIdDelete,
  resetPasswordApiV1AdminUsersUserIdResetPasswordPost,
  updateRoleApiV1AdminUsersUserIdRolePatch,
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
        auth: () => this.authService.getAccessToken() ?? undefined,
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

  listUsers(): Observable<User[]> {
    return from(
      listUsersApiV1AdminUsersGet({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  deleteUser(userId: number): Observable<User> {
    return from(
      removeUserApiV1AdminUsersUserIdDelete({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { user_id: userId },
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  updateUserRole(userId: number, isAdmin: boolean): Observable<User> {
    return from(
      updateRoleApiV1AdminUsersUserIdRolePatch({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { user_id: userId },
        body: { is_admin: isAdmin },
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
