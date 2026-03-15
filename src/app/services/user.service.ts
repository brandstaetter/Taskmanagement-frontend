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
import { createClient, createConfig, type Client } from '../generated/client';
import { AuthService } from './auth.service';

// Re-export types for backward compatibility
export type { UserPasswordChange, UserAvatarUpdate, User };

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private authenticatedClient: Client;

  constructor(private authService: AuthService) {
    this.authenticatedClient = createClient(
      createConfig({
        baseUrl: environment.baseUrl,
        auth: () => this.authService.getAccessToken() ?? undefined,
      })
    );
  }

  private getAuthSecurity() {
    const token = this.authService.getAccessToken();
    return token ? [{ scheme: 'bearer' as const, type: 'http' as const }] : undefined;
  }

  updatePassword(passwordUpdate: UserPasswordChange): Observable<void> {
    return from(
      changePasswordApiV1UsersMePasswordPut({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        body: passwordUpdate,
      })
    ).pipe(map(() => undefined));
  }

  updateAvatar(avatarUpdate: UserAvatarUpdate): Observable<User> {
    return from(
      updateAvatarApiV1UsersMeAvatarPut({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        body: avatarUpdate,
      })
    ).pipe(map(response => response.data as User));
  }
}
