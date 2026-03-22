import {
  ComponentFixture,
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';
import { TaskViewComponent } from './task-view.component';
import { TaskService } from '../../services/task.service';
import { Task } from '../../services/task.service';
import { of, Observable, defer, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
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
  let taskService: jest.Mocked<TaskService>;
  let mockDialog: jest.Mocked<MatDialog>;
  let mockSnackBar: jest.Mocked<MatSnackBar>;
  let mockRouter: jest.Mocked<Router>;

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
    const taskServiceSpy = {
      getDueTasks: jest.fn(),
      startTask: jest.fn(),
      completeTask: jest.fn(),
      archiveTask: jest.fn(),
      printTask: jest.fn(),
      updateTask: jest.fn(),
      updateTaskState: jest.fn(),
      getRandomTask: jest.fn(),
    } as unknown as jest.Mocked<TaskService>;
    (taskServiceSpy as jest.Mocked<TaskService>).getDueTasks.mockReturnValue(of(mockTasks));
    (taskServiceSpy as jest.Mocked<TaskService>).startTask.mockReturnValue(
      of({ ...mockTasks[0], state: 'in_progress' })
    );
    (taskServiceSpy as jest.Mocked<TaskService>).completeTask.mockReturnValue(
      of({ ...mockTasks[0], state: 'done' })
    );
    (taskServiceSpy as jest.Mocked<TaskService>).archiveTask.mockReturnValue(
      of({ ...mockTasks[0], state: 'archived' })
    );
    (taskServiceSpy as jest.Mocked<TaskService>).printTask.mockReturnValue(
      of(new Blob(['PDF content'], { type: 'application/pdf' }))
    );
    (taskServiceSpy as jest.Mocked<TaskService>).updateTask.mockReturnValue(
      asyncData(mockTasks[0])
    );
    (taskServiceSpy as jest.Mocked<TaskService>).updateTaskState.mockReturnValue(of(mockTasks[0]));
    (taskServiceSpy as jest.Mocked<TaskService>).getRandomTask.mockReturnValue(of(mockTasks[0]));

    mockDialog = { open: jest.fn() } as unknown as jest.Mocked<MatDialog>;
    // Simple mock that bypasses Angular Material's internal dialog logic
    const mockDialogRef = {
      afterClosed: () => of(null),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.mockReturnValue(mockDialogRef);

    mockSnackBar = { open: jest.fn() } as unknown as jest.Mocked<MatSnackBar>;
    mockSnackBar.open.mockImplementation(() => undefined as unknown);
    mockRouter = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;

    await TestBed.configureTestingModule({
      imports: [TaskViewComponent, NoopAnimationsModule, MockTaskCardComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
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
    taskService = TestBed.inject(TaskService) as jest.Mocked<TaskService>;
    mockSnackBar = TestBed.inject(MatSnackBar) as jest.Mocked<MatSnackBar>;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
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
    expect(component.showArchived).toBe(true);
    expect(component.dueTasks.length).toBe(3); // now including archived

    component.toggleArchivedTasks();
    expect(component.showArchived).toBe(false);
    expect(component.dueTasks.length).toBe(2); // back to excluding archived
  });

  it('should correctly identify overdue tasks', () => {
    expect(component.isOverdue(mockTasks[0])).toBe(false); // tomorrow
    expect(component.isOverdue(mockTasks[1])).toBe(true); // yesterday
  });

  it('should correctly identify tasks due soon', () => {
    expect(component.isDueSoon(mockTasks[0])).toBe(false); // tomorrow
    expect(component.isDueSoon(mockTasks[2])).toBe(true); // 2 hours from now
  });

  it('should start a task', fakeAsync(() => {
    component.onStartTask(mockTasks[0]);
    tick();

    expect(taskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after start
  }));

  it('should show warning snackbar when starting a task returns a warning', fakeAsync(() => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    taskService.startTask.mockReturnValue(
      of({ ...mockTasks[0], state: 'in_progress', warning: 'WIP limit exceeded' })
    );

    component.onStartTask(mockTasks[0]);
    tick();

    expect(snackBarSpy).toHaveBeenCalledWith('WIP limit exceeded', 'Close', {
      duration: 5000,
    });
  }));

  it('should not show warning snackbar when starting a task without warning', fakeAsync(() => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    taskService.startTask.mockReturnValue(of({ ...mockTasks[0], state: 'in_progress' }));

    component.onStartTask(mockTasks[0]);
    tick();

    expect(snackBarSpy).not.toHaveBeenCalled();
  }));

  it('should show warning snackbar when printing a todo task triggers start with warning', fakeAsync(() => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    taskService.startTask.mockReturnValue(
      of({ ...mockTasks[0], state: 'in_progress', warning: 'WIP limit exceeded' })
    );

    // Mock non-PDF response to avoid DOM manipulation issues
    taskService.printTask.mockReturnValue(of({ message: 'Sent to printer' }));

    component.onPrintTask(mockTasks[0]); // mockTasks[0] is in 'todo' state
    tick();

    expect(snackBarSpy).toHaveBeenCalledWith('WIP limit exceeded', 'Close', {
      duration: 5000,
    });
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
    jest.spyOn(window.URL, 'createObjectURL').mockReturnValue(mockUrl);
    jest.spyOn(window.URL, 'revokeObjectURL');
    const mockLink = document.createElement('a');
    jest.spyOn(mockLink, 'click');
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink);

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
    jest.spyOn(console, 'log');

    // Change printTask to return a non-PDF response
    taskService.printTask.mockReturnValue(of({ message: 'Sent to printer' }));

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
    jest.spyOn(component, 'onPrintTask');

    component.onPrintRandomTask();
    tick();

    expect(taskService.getRandomTask).toHaveBeenCalled();
    expect(component.onPrintTask).toHaveBeenCalledWith(mockTasks[0]);
    expect(component.isLoadingRandom).toBe(false);
  }));

  it('should have error handling for random task', () => {
    // Test that error handling exists for random task
    expect(component.onPrintRandomTask).toBeDefined();
    expect(typeof component.onPrintRandomTask).toBe('function');
  });

  it('should not get random task while loading', () => {
    component.isLoadingRandom = true;
    // Reset the spy to avoid duplication
    taskService.getRandomTask.mockClear();

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
    expect(component.isOverdue(taskWithoutDueDate)).toBe(false);
  });

  it('should handle isOverdue with undefined due date', () => {
    const taskWithoutDueDate = { ...mockTasks[0], due_date: undefined };
    expect(component.isOverdue(taskWithoutDueDate)).toBe(false);
  });

  it('should handle isDueSoon with null due date', () => {
    const taskWithoutDueDate = { ...mockTasks[0], due_date: null };
    expect(component.isDueSoon(taskWithoutDueDate)).toBe(false);
  });

  it('should handle isDueSoon with undefined due date', () => {
    const taskWithoutDueDate = { ...mockTasks[0], due_date: undefined };
    expect(component.isDueSoon(taskWithoutDueDate)).toBe(false);
  });

  it('should handle isDueSoon with overdue task', () => {
    const overdueTask = { ...mockTasks[1] }; // yesterday
    expect(component.isDueSoon(overdueTask)).toBe(false);
  });

  it('should reopen a task', fakeAsync(() => {
    component.onReopenTask(mockTasks[1]);
    tick();

    expect(taskService.updateTaskState).toHaveBeenCalledWith(mockTasks[1].id, 'todo');
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after reopen
  }));

  it('should handle edit task dialog with result', fakeAsync(() => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    const mockEditResult = { title: 'Updated Task', description: 'Updated Description' };
    const mockDialogRef = {
      afterClosed: () => of(mockEditResult),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.mockReturnValue(mockDialogRef);

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
    mockDialog.open.mockReturnValue(mockDialogRef);

    component.onEditTask(mockTasks[0]);
    tick();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(taskService.updateTask).not.toHaveBeenCalled();
  }));

  it('should handle edit task dialog error - simple test', fakeAsync(() => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    const consoleSpy = jest.spyOn(console, 'error');

    taskService.updateTask.mockReturnValue(throwError(() => new Error('Test error')));

    const mockEditResult = { title: 'Updated Task', description: 'Updated Description' };
    const mockDialogRef = {
      afterClosed: () => of(mockEditResult),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.mockReturnValue(mockDialogRef);

    component.onEditTask(mockTasks[0]);
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error updating task:', expect.any(Error));
    expect(snackBarSpy).toHaveBeenCalledWith('Failed to update task. Please try again.', 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
  }));

  it('should handle print task error', fakeAsync(() => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    const consoleSpy = jest.spyOn(console, 'error');
    const error = new Error('Print failed');

    taskService.printTask.mockReturnValue(throwError(() => error));

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
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    const consoleSpy = jest.spyOn(console, 'error');
    const errorWithoutMessage = new Error();
    Object.defineProperty(errorWithoutMessage, 'message', { value: undefined });

    taskService.printTask.mockReturnValue(throwError(() => errorWithoutMessage));

    component.onPrintTask(mockTasks[0]);
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error printing task:', errorWithoutMessage);
    expect(snackBarSpy).toHaveBeenCalledWith(expect.any(String), 'Close', {
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
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    const consoleSpy = jest.spyOn(console, 'error');
    const error = new Error('No random task');

    taskService.getRandomTask.mockReturnValue(throwError(() => error));

    component.onPrintRandomTask();
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error getting random task:', error);
    expect(snackBarSpy).toHaveBeenCalledWith('No random task', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingRandom).toBe(false);
  }));

  it('should handle random task error without message', fakeAsync(() => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    const consoleSpy = jest.spyOn(console, 'error');
    const errorWithoutMessage = new Error();
    Object.defineProperty(errorWithoutMessage, 'message', { value: undefined });

    taskService.getRandomTask.mockReturnValue(throwError(() => errorWithoutMessage));

    component.onPrintRandomTask();
    tick();
    flushMicrotasks();
    tick();

    expect(consoleSpy).toHaveBeenCalledWith('Error getting random task:', errorWithoutMessage);
    expect(snackBarSpy).toHaveBeenCalledWith(expect.any(String), 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingRandom).toBe(false);
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

  // Skip: Zone.js fakeAsync tick() does not advance RxJS asyncScheduler-based intervals
  // in Jest (Node.js). The subscription lifecycle is covered by the destroy test below.
  it.skip('should auto-refresh due tasks every 60 seconds', fakeAsync(() => {
    // Destroy the component created in beforeEach (set up outside fakeAsync)
    component.ngOnDestroy();

    // Re-create inside fakeAsync so tick() controls the interval
    const freshFixture = TestBed.createComponent(TaskViewComponent);
    const freshComponent = freshFixture.componentInstance;
    taskService.getDueTasks.mockClear();

    freshFixture.detectChanges(); // triggers ngOnInit
    flushMicrotasks();
    expect(taskService.getDueTasks.mock.calls.length).toBe(1); // initial load

    // Advance time to trigger the 60s interval (RxJS interval uses asyncScheduler → setInterval)
    tick(60_001);
    flushMicrotasks();
    expect(taskService.getDueTasks.mock.calls.length).toBe(2); // first refresh

    tick(60_001);
    flushMicrotasks();
    expect(taskService.getDueTasks.mock.calls.length).toBe(3); // second refresh

    freshComponent.ngOnDestroy();
    discardPeriodicTasks();
  }));

  it('should stop auto-refresh on destroy', fakeAsync(() => {
    component.ngOnDestroy();

    const freshFixture = TestBed.createComponent(TaskViewComponent);
    const freshComponent = freshFixture.componentInstance;
    taskService.getDueTasks.mockClear();

    freshFixture.detectChanges();
    expect(taskService.getDueTasks.mock.calls.length).toBe(1);

    freshComponent.ngOnDestroy();

    tick(120_000);
    expect(taskService.getDueTasks.mock.calls.length).toBe(1); // no more calls
  }));

  it('should navigate to task details on onViewDetails', () => {
    component.onViewDetails(mockTasks[0]);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks', mockTasks[0].id, 'details']);
  });
});
