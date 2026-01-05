import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  UserPasswordChange,
  UserAvatarUpdate,
  changePasswordApiV1UsersMePasswordPut,
  updateAvatarApiV1UsersMeAvatarPut,
  User,
} from '../generated';

// Re-export types for backward compatibility
export type { UserPasswordChange, UserAvatarUpdate, User };

@Injectable({
  providedIn: 'root',
})
export class UserService {
  updatePassword(passwordUpdate: UserPasswordChange): Observable<void> {
    return from(
      changePasswordApiV1UsersMePasswordPut({
        baseUrl: environment.baseUrl,
        body: passwordUpdate,
      })
    ).pipe(
      map(() => undefined) // Convert to void
    );
  }

  updateAvatar(avatarUpdate: UserAvatarUpdate): Observable<User> {
    return from(
      updateAvatarApiV1UsersMeAvatarPut({
        baseUrl: environment.baseUrl,
        body: avatarUpdate,
      })
    ).pipe(map(response => response.data as User));
  }
}
