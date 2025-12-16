import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserCreate, PasswordReset } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/v1`;

  constructor(private http: HttpClient) {}

  createUser(user: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admin/users`, user);
  }

  resetUserPassword(userId: number, passwordReset: PasswordReset): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/admin/users/${userId}/reset-password`,
      passwordReset
    );
  }

  initDatabase(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/admin/db/init`, {});
  }

  migrateDatabase(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/admin/db/migrate`, {});
  }
}
