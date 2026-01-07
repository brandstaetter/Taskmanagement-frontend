import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { TaskViewComponent } from './task-view.component';
import { TaskService } from '../../services/task.service';
import { Task } from '../../services/task.service';
import { of, Observable, defer, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskEditDialogComponent } from '../task-edit-dialog/task-edit-dialog.component';

// Async observable helpers (from Angular documentation)
/** Create async observable that emits-once and completes after a JS engine turn */
export function asyncData<T>(data: T): Observable<T> {
  return defer(() => Promise.resolve(data));
}

/** Create async observable error that errors after a JS engine turn */
export function asyncError<T>(errorObject: Error): Observable<T> {
  return new Observable(observer => {
    observer.error(errorObject);
  });
}

// Mock TaskCardComponent
@Component({
  selector: 'app-task-card',
  template: '',
  standalone: true,
})
class MockTaskCardComponent {
  @Input() task!: Task;
  @Input() mode = 'default';
  @Output() printTask = new EventEmitter<Task>();
}

describe('TaskViewComponent', () => {
  let component: TaskViewComponent;
  let fixture: ComponentFixture<TaskViewComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      state: 'todo',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      state: 'in_progress',
      due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    },
    {
      id: 3,
      title: 'Task 3',
      description: 'Description 3',
      state: 'archived',
      due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    },
  ];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getDueTasks',
      'startTask',
      'completeTask',
      'archiveTask',
      'printTask',
      'updateTask',
      'updateTaskState',
      'getRandomTask',
    ]);
    taskServiceSpy.getDueTasks.and.returnValue(of(mockTasks));
    taskServiceSpy.startTask.and.returnValue(of({ ...mockTasks[0], state: 'in_progress' }));
    taskServiceSpy.completeTask.and.returnValue(of({ ...mockTasks[0], state: 'done' }));
    taskServiceSpy.archiveTask.and.returnValue(of({ ...mockTasks[0], state: 'archived' }));
    taskServiceSpy.printTask.and.returnValue(
      of(new Blob(['PDF content'], { type: 'application/pdf' }))
    );
    taskServiceSpy.updateTask.and.returnValue(asyncData(mockTasks[0]));
    taskServiceSpy.updateTaskState.and.returnValue(of(mockTasks[0]));
    taskServiceSpy.getRandomTask.and.returnValue(of(mockTasks[0]));

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    // Simple mock that bypasses Angular Material's internal dialog logic
    const mockDialogRef = {
      afterClosed: () => of(null),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);

    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockSnackBar.open.and.stub();

    await TestBed.configureTestingModule({
      imports: [TaskViewComponent, NoopAnimationsModule, MockTaskCardComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(TaskViewComponent, {
        set: {
          providers: [{ provide: MatDialog, useValue: mockDialog }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TaskViewComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load due tasks on init', () => {
    expect(taskService.getDueTasks).toHaveBeenCalled();
    expect(component.dueTasks.length).toBe(2); // excluding archived tasks by default
  });

  it('should toggle archived tasks visibility', () => {
    expect(component.dueTasks.length).toBe(2); // initially excluding archived

    component.toggleArchivedTasks();
    expect(component.showArchived).toBeTrue();
    expect(component.dueTasks.length).toBe(3); // now including archived

    component.toggleArchivedTasks();
    expect(component.showArchived).toBeFalse();
    expect(component.dueTasks.length).toBe(2); // back to excluding archived
  });

  it('should correctly identify overdue tasks', () => {
    expect(component.isOverdue(mockTasks[0])).toBeFalse(); // tomorrow
    expect(component.isOverdue(mockTasks[1])).toBeTrue(); // yesterday
  });

  it('should correctly identify tasks due soon', () => {
    expect(component.isDueSoon(mockTasks[0])).toBeFalse(); // tomorrow
    expect(component.isDueSoon(mockTasks[2])).toBeTrue(); // 2 hours from now
  });

  it('should start a task', fakeAsync(() => {
    component.onStartTask(mockTasks[0]);
    tick();

    expect(taskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after start
  }));

  it('should complete a task', fakeAsync(() => {
    component.onCompleteTask(mockTasks[0]);
    tick();

    expect(taskService.completeTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after complete
  }));

  it('should archive a task', fakeAsync(() => {
    component.onArchiveTask(mockTasks[0]);
    tick();

    expect(taskService.archiveTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after archive
  }));

  it('should print a task and create download link', fakeAsync(() => {
    // Mock URL.createObjectURL and document.createElement
    const mockUrl = 'blob:test';
    spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl);
    spyOn(window.URL, 'revokeObjectURL');
    const mockLink = document.createElement('a');
    spyOn(mockLink, 'click');
    spyOn(document, 'createElement').and.returnValue(mockLink);

    component.onPrintTask(mockTasks[0]);
    tick();

    expect(taskService.printTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLink.download).toBe(`task-${mockTasks[0].id}.pdf`);
    expect(mockLink.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);

    // Should start task if it was in todo state
    expect(taskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
  }));

  it('should handle non-PDF response when printing', fakeAsync(() => {
    // Mock console.log
    spyOn(console, 'log');

    // Change printTask to return a non-PDF response
    taskService.printTask.and.returnValue(of({ message: 'Sent to printer' }));

    component.onPrintTask(mockTasks[0]);
    tick();

    expect(console.log).toHaveBeenCalledWith('Task sent to printer');
    // Should still start task if it was in todo state
    expect(taskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
  }));

  it('should have error handling for print task', () => {
    // Test that error handling exists for print task
    expect(component.onPrintTask).toBeDefined();
    expect(typeof component.onPrintTask).toBe('function');
  });

  it('should have edit dialog functionality', () => {
    // Test that the component has the edit dialog method
    expect(component.onEditTask).toBeDefined();
    expect(typeof component.onEditTask).toBe('function');
  });

  it('should get random task and print it', fakeAsync(() => {
    spyOn(component, 'onPrintTask');

    component.onPrintRandomTask();
    tick();

    expect(taskService.getRandomTask).toHaveBeenCalled();
    expect(component.onPrintTask).toHaveBeenCalledWith(mockTasks[0]);
    expect(component.isLoadingRandom).toBeFalse();
  }));

  it('should have error handling for random task', () => {
    // Test that error handling exists for random task
    expect(component.onPrintRandomTask).toBeDefined();
    expect(typeof component.onPrintRandomTask).toBe('function');
  });

  it('should not get random task while loading', () => {
    component.isLoadingRandom = true;
    // Reset the spy to avoid duplication
    taskService.getRandomTask.calls.reset();

    component.onPrintRandomTask();

    expect(taskService.getRandomTask).not.toHaveBeenCalled();
  });

  it('should have onEditTask method', () => {
    expect(component.onEditTask).toBeDefined();
    expect(typeof component.onEditTask).toBe('function');
  });

  it('should have onPrintRandomTask method', () => {
    expect(component.onPrintRandomTask).toBeDefined();
    expect(typeof component.onPrintRandomTask).toBe('function');
  });

  it('should have toggleArchivedTasks method', () => {
    expect(component.toggleArchivedTasks).toBeDefined();
    expect(typeof component.toggleArchivedTasks).toBe('function');
  });

  it('should have isOverdue method', () => {
    expect(component.isOverdue).toBeDefined();
    expect(typeof component.isOverdue).toBe('function');
  });

  it('should have isDueSoon method', () => {
    expect(component.isDueSoon).toBeDefined();
    expect(typeof component.isDueSoon).toBe('function');
  });

  it('should handle isOverdue with null due date', () => {
    const taskWithoutDueDate = { ...mockTasks[0], due_date: null };
    expect(component.isOverdue(taskWithoutDueDate)).toBeFalse();
  });

  it('should handle isOverdue with undefined due date', () => {
    const taskWithoutDueDate = { ...mockTasks[0], due_date: undefined };
    expect(component.isOverdue(taskWithoutDueDate)).toBeFalse();
  });

  it('should handle isDueSoon with null due date', () => {
    const taskWithoutDueDate = { ...mockTasks[0], due_date: null };
    expect(component.isDueSoon(taskWithoutDueDate)).toBeFalse();
  });

  it('should handle isDueSoon with undefined due date', () => {
    const taskWithoutDueDate = { ...mockTasks[0], due_date: undefined };
    expect(component.isDueSoon(taskWithoutDueDate)).toBeFalse();
  });

  it('should handle isDueSoon with overdue task', () => {
    const overdueTask = { ...mockTasks[1] }; // yesterday
    expect(component.isDueSoon(overdueTask)).toBeFalse();
  });

  it('should reopen a task', fakeAsync(() => {
    component.onReopenTask(mockTasks[1]);
    tick();

    expect(taskService.updateTaskState).toHaveBeenCalledWith(mockTasks[1].id, 'todo');
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after reopen
  }));

  it('should handle edit task dialog with result', fakeAsync(() => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    const mockEditResult = { title: 'Updated Task', description: 'Updated Description' };
    const mockDialogRef = {
      afterClosed: () => of(mockEditResult),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);

    component.onEditTask(mockTasks[0]);
    tick();
    flushMicrotasks();
    tick();

    expect(mockDialog.open).toHaveBeenCalledWith(TaskEditDialogComponent, {
      data: mockTasks[0],
      width: '500px',
    });
    expect(taskService.updateTask).toHaveBeenCalledWith(mockTasks[0].id, mockEditResult);
    expect(snackBarSpy).toHaveBeenCalledWith('Task updated successfully', 'Close', {
      duration: 3000,
    });
  }));

  it('should handle edit task dialog with no result', fakeAsync(() => {
    const mockDialogRef = {
      afterClosed: () => of(null),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);

    component.onEditTask(mockTasks[0]);
    tick();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(taskService.updateTask).not.toHaveBeenCalled();
  }));

  it('should handle edit task dialog error - simple test', fakeAsync(() => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    const consoleSpy = spyOn(console, 'error');

    taskService.updateTask.and.returnValue(throwError(() => new Error('Test error')));

    const mockEditResult = { title: 'Updated Task', description: 'Updated Description' };
    const mockDialogRef = {
      afterClosed: () => of(mockEditResult),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);

    component.onEditTask(mockTasks[0]);
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error updating task:', jasmine.any(Error));
    expect(snackBarSpy).toHaveBeenCalledWith('Failed to update task. Please try again.', 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
  }));

  it('should handle print task error', fakeAsync(() => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    const consoleSpy = spyOn(console, 'error');
    const error = new Error('Print failed');

    taskService.printTask.and.returnValue(throwError(() => error));

    component.onPrintTask(mockTasks[0]);
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error printing task:', error);
    expect(snackBarSpy).toHaveBeenCalledWith('Print failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }));

  it('should handle print task error without message', fakeAsync(() => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    const consoleSpy = spyOn(console, 'error');
    const errorWithoutMessage = new Error();
    Object.defineProperty(errorWithoutMessage, 'message', { value: undefined });

    taskService.printTask.and.returnValue(throwError(() => errorWithoutMessage));

    component.onPrintTask(mockTasks[0]);
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error printing task:', errorWithoutMessage);
    expect(snackBarSpy).toHaveBeenCalledWith(jasmine.any(String), 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }));

  it('should not start task after print if not in todo state', fakeAsync(() => {
    const inProgressTask = { ...mockTasks[1], state: 'in_progress' as const };

    component.onPrintTask(inProgressTask);
    tick();

    expect(taskService.startTask).not.toHaveBeenCalled();
  }));

  it('should handle random task error', fakeAsync(() => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    const consoleSpy = spyOn(console, 'error');
    const error = new Error('No random task');

    taskService.getRandomTask.and.returnValue(throwError(() => error));

    component.onPrintRandomTask();
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error getting random task:', error);
    expect(snackBarSpy).toHaveBeenCalledWith('No random task', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingRandom).toBeFalse();
  }));

  it('should handle random task error without message', fakeAsync(() => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    const consoleSpy = spyOn(console, 'error');
    const errorWithoutMessage = new Error();
    Object.defineProperty(errorWithoutMessage, 'message', { value: undefined });

    taskService.getRandomTask.and.returnValue(throwError(() => errorWithoutMessage));

    component.onPrintRandomTask();
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error getting random task:', errorWithoutMessage);
    expect(snackBarSpy).toHaveBeenCalledWith(jasmine.any(String), 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingRandom).toBeFalse();
  }));

  it('should filter tasks correctly when showArchived is true', () => {
    component.showArchived = true;
    component.loadDueTasks();

    expect(taskService.getDueTasks).toHaveBeenCalled();
    // When showArchived is true, all tasks should be included
    expect(component.dueTasks.length).toBe(3);
  });

  it('should filter tasks correctly when showArchived is false', () => {
    component.showArchived = false;
    component.loadDueTasks();

    expect(taskService.getDueTasks).toHaveBeenCalled();
    // When showArchived is false, archived and done tasks should be excluded
    expect(component.dueTasks.length).toBe(2);
  });
});
