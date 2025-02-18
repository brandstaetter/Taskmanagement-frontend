import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Task {
  id: number;
  title: string;
  description: string;
  state: 'todo' | 'in_progress' | 'done' | 'archived';
  due_date?: string;
  reward?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface TaskCreate {
  title: string;
  description: string;
  state?: 'todo' | 'in_progress' | 'done' | 'archived';
  due_date?: string;
  reward?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiBaseUrl = environment.apiUrl;
  private apiUrl = `${this.apiBaseUrl}/v1`;

  constructor(private http: HttpClient) {}

  getTasks(skip = 0, limit = 100, includeArchived = false): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, {
      params: {
        skip: skip.toString(),
        limit: limit.toString(),
        include_archived: includeArchived.toString(),
      },
    });
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  getDueTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/due/`);
  }

  getRandomTask(): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/random/`);
  }

  searchTasks(query: string, includeArchived = false): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks/search/`, {
      params: {
        q: query,
        include_archived: includeArchived.toString(),
      },
    });
  }

  createTask(task: TaskCreate): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  startTask(id: number): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/${id}/start`, {});
  }

  printTask(id: number, printerType?: string): Observable<Blob | Record<string, unknown>> {
    return this.http
      .post(
        `${this.apiUrl}/tasks/${id}/print`,
        {},
        {
          params: printerType ? { printer_type: printerType } : {},
          observe: 'response',
          responseType: 'blob',
        }
      )
      .pipe(
        mergeMap(response => {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/pdf')) {
            return of(response.body as Blob);
          }
          // If it's not a PDF, convert the blob to JSON
          return from(
            new Promise<Record<string, unknown>>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const result = JSON.parse(reader.result as string) as Record<string, unknown>;
                  resolve(result);
                } catch {
                  reject(new Error('Invalid JSON response'));
                }
              };
              reader.onerror = () => reject(new Error(reader.error?.message || 'Error reading file'));
              reader.readAsText(response.body as Blob);
            })
          );
        })
      );
  }

  completeTask(id: number): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/${id}/complete`, {});
  }

  archiveTask(id: number): Observable<Task> {
    return this.http.delete<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  triggerMaintenance(): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/tasks/maintenance`, {});
  }

  login(username: string, password: string): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/token`, formData);
  }

  // Admin endpoints - these require authentication
  initDb(): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/admin/db/init`, {});
  }

  runMigrations(): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/admin/db/migrate`, {});
  }
}
