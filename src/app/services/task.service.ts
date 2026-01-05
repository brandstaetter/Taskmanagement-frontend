import { Injectable } from '@angular/core';
import { Observable, throwError, of, from } from 'rxjs';
import { catchError, mergeMap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Task,
  TaskCreate,
  TaskUpdate,
  readTasksApiV1TasksGet,
  createNewTaskApiV1TasksPost,
  readDueTasksApiV1TasksDueGet,
  getRandomTaskApiV1TasksRandomGet,
  searchTasksApiV1TasksSearchGet,
  deleteTaskEndpointApiV1TasksTaskIdDelete,
  readTaskApiV1TasksTaskIdGet,
  updateTaskEndpointApiV1TasksTaskIdPatch,
  startTaskApiV1TasksTaskIdStartPost,
  completeTaskApiV1TasksTaskIdCompletePost,
  printTaskApiV1TasksTaskIdPrintPost,
  triggerMaintenanceApiV1TasksMaintenancePost,
  resetTaskToTodoEndpointApiV1TasksTaskIdResetToTodoPatch,
} from '../generated';
import { createClient, createConfig, type Client } from '../generated/client';
import { AuthService } from './auth.service';

// Re-export types for backward compatibility
export type { Task, TaskCreate, TaskUpdate };

@Injectable({
  providedIn: 'root',
})
export class TaskService {
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

  getTasks(skip = 0, limit = 100, includeArchived = false): Observable<Task[]> {
    return from(
      readTasksApiV1TasksGet({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        query: {
          skip,
          limit,
          include_archived: includeArchived,
        },
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  getTask(id: number): Observable<Task> {
    return from(
      readTaskApiV1TasksTaskIdGet({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { task_id: id },
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  getDueTasks(): Observable<Task[]> {
    return from(
      readDueTasksApiV1TasksDueGet({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  getRandomTask(): Observable<Task> {
    return from(
      getRandomTaskApiV1TasksRandomGet({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
      })
    ).pipe(
      map(response => {
        if (response.error) {
          throw response.error;
        }
        return response.data as Task;
      }),
      catchError(error => {
        // Check if it's a 404 error from the response
        if (error?.response?.status === 404 || error?.status === 404) {
          return throwError(
            () => new Error('No tasks available to select from. Please create some tasks first.')
          );
        }
        return throwError(() => new Error('Failed to get random task. Please try again later.'));
      })
    );
  }

  searchTasks(query: string, includeArchived = false): Observable<Task[]> {
    return from(
      searchTasksApiV1TasksSearchGet({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        query: {
          q: query,
          include_archived: includeArchived,
        },
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  createTask(task: TaskCreate): Observable<Task> {
    return from(
      createNewTaskApiV1TasksPost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        body: task,
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  startTask(id: number): Observable<Task> {
    return from(
      startTaskApiV1TasksTaskIdStartPost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { task_id: id },
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  printTask(id: number, printerType?: string): Observable<Blob | Record<string, unknown>> {
    return from(
      printTaskApiV1TasksTaskIdPrintPost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { task_id: id },
        query: printerType ? { printer_type: printerType } : undefined,
      })
    ).pipe(
      mergeMap(response => {
        const data = response.data as unknown;
        // If it's a Blob, return it directly
        if (data instanceof Blob) {
          return of(data);
        }
        // Otherwise, treat it as JSON
        return of(data as Record<string, unknown>);
      })
    );
  }

  completeTask(id: number): Observable<Task> {
    return from(
      completeTaskApiV1TasksTaskIdCompletePost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { task_id: id },
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  archiveTask(taskId: number): Observable<Task> {
    return from(
      deleteTaskEndpointApiV1TasksTaskIdDelete({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { task_id: taskId },
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  updateTaskState(
    taskId: number,
    state: 'todo' | 'in_progress' | 'done' | 'archived'
  ): Observable<Task> {
    switch (state) {
      case 'todo':
        return from(
          resetTaskToTodoEndpointApiV1TasksTaskIdResetToTodoPatch({
            client: this.authenticatedClient,
            security: this.getAuthSecurity(),
            path: { task_id: taskId },
          })
        ).pipe(map(response => this.handleApiResponse(response)));
      case 'in_progress':
        return this.startTask(taskId);
      case 'done':
        return this.completeTask(taskId);
      case 'archived':
        return this.archiveTask(taskId);
      default:
        return throwError(() => new Error(`Unsupported state transition: ${state}`));
    }
  }

  updateTask(taskId: number, update: TaskUpdate): Observable<Task> {
    return from(
      updateTaskEndpointApiV1TasksTaskIdPatch({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
        path: { task_id: taskId },
        body: update,
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }

  triggerMaintenance(): Observable<Record<string, unknown>> {
    return from(
      triggerMaintenanceApiV1TasksMaintenancePost({
        client: this.authenticatedClient,
        security: this.getAuthSecurity(),
      })
    ).pipe(map(response => this.handleApiResponse(response)));
  }
}
