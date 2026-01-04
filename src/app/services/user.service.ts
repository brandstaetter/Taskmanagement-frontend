import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  UserPasswordChange,
  UserAvatarUpdate,
  changePasswordApiV1UsersMePasswordPut,
  updateAvatarApiV1UsersMeAvatarPut,
} from '../generated';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';

// Re-export types for backward compatibility
export type { UserPasswordChange, UserAvatarUpdate };

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private authService: AuthService) {}

  updatePassword(passwordUpdate: UserPasswordChange): Observable<void> {
    return from(
      changePasswordApiV1UsersMePasswordPut({
        baseUrl: environment.apiUrl,
        body: passwordUpdate,
      })
    ).pipe(
      map(() => undefined) // Convert to void
    );
  }

  updateAvatar(avatarUpdate: UserAvatarUpdate): Observable<User> {
    return from(
      updateAvatarApiV1UsersMeAvatarPut({
        baseUrl: environment.apiUrl,
        body: avatarUpdate,
      })
    ).pipe(
      map(response => {
        // Merge generated response with current user data to include is_superadmin
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          return {
            ...response.data,
            is_superadmin: currentUser.is_superadmin,
          } as User;
        }
        return response.data as User;
      })
    );
  }
}
