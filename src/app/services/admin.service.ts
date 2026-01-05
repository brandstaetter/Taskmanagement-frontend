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
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  createUser(user: AdminUserCreate): Observable<User> {
    return from(
      createNewUserApiV1AdminUsersPost({
        baseUrl: environment.baseUrl,
        body: user,
      })
    ).pipe(map(response => response.data as User));
  }

  resetUserPassword(userId: number): Observable<PasswordResetResponse> {
    return from(
      resetPasswordApiV1AdminUsersUserIdResetPasswordPost({
        baseUrl: environment.baseUrl,
        path: { user_id: userId },
      })
    ).pipe(map(response => response.data as PasswordResetResponse));
  }

  initDatabase(): Observable<{ message: string }> {
    return from(
      initDbApiV1AdminDbInitPost({
        baseUrl: environment.baseUrl,
      })
    ).pipe(map(response => response.data as { message: string }));
  }

  migrateDatabase(): Observable<{ message: string }> {
    return from(
      runMigrationsApiV1AdminDbMigratePost({
        baseUrl: environment.baseUrl,
      })
    ).pipe(map(response => response.data as { message: string }));
  }
}
