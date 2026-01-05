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

// Re-export types for backward compatibility
export type { Task, TaskCreate, TaskUpdate };

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  getTasks(skip = 0, limit = 100, includeArchived = false): Observable<Task[]> {
    return from(
      readTasksApiV1TasksGet({
        baseUrl: environment.baseUrl,
        query: {
          skip,
          limit,
          include_archived: includeArchived,
        },
      })
    ).pipe(map(response => response.data as Task[]));
  }

  getTask(id: number): Observable<Task> {
    return from(
      readTaskApiV1TasksTaskIdGet({
        baseUrl: environment.baseUrl,
        path: { task_id: id },
      })
    ).pipe(map(response => response.data as Task));
  }

  getDueTasks(): Observable<Task[]> {
    return from(
      readDueTasksApiV1TasksDueGet({
        baseUrl: environment.baseUrl,
      })
    ).pipe(map(response => response.data as Task[]));
  }

  getRandomTask(): Observable<Task> {
    return from(
      getRandomTaskApiV1TasksRandomGet({
        baseUrl: environment.baseUrl,
      })
    ).pipe(
      map(response => response.data as Task),
      catchError(error => {
        if (error?.status === 404) {
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
        baseUrl: environment.baseUrl,
        query: {
          q: query,
          include_archived: includeArchived,
        },
      })
    ).pipe(map(response => response.data as Task[]));
  }

  createTask(task: TaskCreate): Observable<Task> {
    return from(
      createNewTaskApiV1TasksPost({
        baseUrl: environment.baseUrl,
        body: task,
      })
    ).pipe(map(response => response.data as Task));
  }

  startTask(id: number): Observable<Task> {
    return from(
      startTaskApiV1TasksTaskIdStartPost({
        baseUrl: environment.baseUrl,
        path: { task_id: id },
      })
    ).pipe(map(response => response.data as Task));
  }

  printTask(id: number, printerType?: string): Observable<Blob | Record<string, unknown>> {
    return from(
      printTaskApiV1TasksTaskIdPrintPost({
        baseUrl: environment.baseUrl,
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
        baseUrl: environment.baseUrl,
        path: { task_id: id },
      })
    ).pipe(map(response => response.data as Task));
  }

  archiveTask(taskId: number): Observable<Task> {
    return from(
      deleteTaskEndpointApiV1TasksTaskIdDelete({
        baseUrl: environment.baseUrl,
        path: { task_id: taskId },
      })
    ).pipe(map(response => response.data as Task));
  }

  updateTaskState(
    taskId: number,
    state: 'todo' | 'in_progress' | 'done' | 'archived'
  ): Observable<Task> {
    switch (state) {
      case 'todo':
        return from(
          resetTaskToTodoEndpointApiV1TasksTaskIdResetToTodoPatch({
            baseUrl: environment.baseUrl,
            path: { task_id: taskId },
          })
        ).pipe(map(response => response.data as Task));
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
        baseUrl: environment.baseUrl,
        path: { task_id: taskId },
        body: update,
      })
    ).pipe(map(response => response.data as Task));
  }

  triggerMaintenance(): Observable<Record<string, unknown>> {
    return from(
      triggerMaintenanceApiV1TasksMaintenancePost({
        baseUrl: environment.baseUrl,
      })
    ).pipe(map(response => response.data as Record<string, unknown>));
  }
}
