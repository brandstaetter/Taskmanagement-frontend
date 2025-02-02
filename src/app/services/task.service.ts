import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Task {
  id: number;
  title: string;
  description: string;
  state: 'todo' | 'in_progress' | 'done';
  due_date?: string;
  reward?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

export interface TaskCreate {
  title: string;
  description: string;
  state?: 'todo' | 'in_progress' | 'done';
  due_date?: string;
  reward?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) { }

  getTasks(skip: number = 0, limit: number = 100): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, {
      params: { skip: skip.toString(), limit: limit.toString() }
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

  createTask(task: TaskCreate): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  startTask(id: number): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/${id}/start`, {});
  }

  printTask(id: number, printerType?: string): Observable<Blob | any> {
    return this.http.get(`${this.apiUrl}/tasks/${id}/print`, {
      params: printerType ? { printer_type: printerType } : {},
      observe: 'response',
      responseType: 'blob'
    }).pipe(
      map(response => {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/pdf')) {
          return response.body;
        }
        // If it's not a PDF, convert the blob to JSON
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              resolve(JSON.parse(reader.result as string));
            } catch {
              reject(new Error('Invalid JSON response'));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsText(response.body as Blob);
        });
      })
    );
  }

  completeTask(id: number): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/tasks/${id}/complete`, {});
  }
}
