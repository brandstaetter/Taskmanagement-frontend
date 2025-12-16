import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, PasswordUpdate, AvatarUpdate } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/v1`;

  constructor(private http: HttpClient) {}

  // Note: These endpoints may need to be implemented in the backend
  updatePassword(passwordUpdate: PasswordUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/me/password`, passwordUpdate);
  }

  updateAvatar(avatarUpdate: AvatarUpdate): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/me/avatar`, avatarUpdate);
  }
}
