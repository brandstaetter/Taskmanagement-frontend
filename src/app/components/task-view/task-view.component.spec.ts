import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskViewComponent } from './task-view.component';
import { TaskService } from '../../services/task.service';
import { Task } from '../../services/task.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

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
      'getRandomTask',
    ]);
    taskServiceSpy.getDueTasks.and.returnValue(of(mockTasks));
    taskServiceSpy.startTask.and.returnValue(of({ ...mockTasks[0], state: 'in_progress' }));
    taskServiceSpy.completeTask.and.returnValue(of({ ...mockTasks[0], state: 'done' }));
    taskServiceSpy.archiveTask.and.returnValue(of({ ...mockTasks[0], state: 'archived' }));
    taskServiceSpy.printTask.and.returnValue(
      of(new Blob(['PDF content'], { type: 'application/pdf' }))
    );
    taskServiceSpy.updateTask.and.returnValue(of(mockTasks[0]));
    taskServiceSpy.getRandomTask.and.returnValue(of(mockTasks[0]));

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    // Initialize the open spy to return a proper mock with all required properties
    const mockDialogRef = {
      afterClosed: () => of(null),
      close: () => { return; },
      componentInstance: null,
      id: 'test-dialog',
      getState: () => ({}),
      updatePosition: () => { return; },
      updateSize: () => { return; },
      addPanelClass: () => { return; },
      removePanelClass: () => { return; },
      beforeClosed: () => of(null),
      backdropClick: () => of(null),
      keydownEvents: () => of(null),
      disableClose: false,
      hasBackdrop: false,
    } as unknown as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);

    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [TaskViewComponent, NoopAnimationsModule, MockTaskCardComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskViewComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
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

  it('should handle print task error', fakeAsync(() => {
    // Mock console.error
    spyOn(console, 'error');

    // Change printTask to return an error
    taskService.printTask.and.returnValue(throwError(() => new Error('Print failed')));

    component.onPrintTask(mockTasks[0]);
    tick();

    expect(console.error).toHaveBeenCalledWith('Error printing task:', jasmine.any(Error));
    expect(mockSnackBar.open).toHaveBeenCalledWith('Print failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }));

  it('should open edit dialog', () => {
    const mockDialogRef = {
      afterClosed: () => of({ title: 'Updated Task' })
    } as unknown as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);

    component.onEditTask(mockTasks[0]);

    expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Object), {
      data: mockTasks[0],
      width: '500px',
    });
  });

  it('should handle edit dialog result', fakeAsync(() => {
    const mockDialogRef = {
      afterClosed: () => of({ title: 'Updated Task' })
    } as unknown as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);

    component.onEditTask(mockTasks[0]);
    tick();

    expect(taskService.updateTask).toHaveBeenCalledWith(mockTasks[0].id, { title: 'Updated Task' });
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after update
  }));

  it('should handle edit dialog error', fakeAsync(() => {
    const mockDialogRef = {
      afterClosed: () => of({ title: 'Updated Task' })
    } as unknown as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);
    spyOn(console, 'error');

    // Change updateTask to return an error
    taskService.updateTask.and.returnValue(throwError(() => new Error('Update failed')));

    component.onEditTask(mockTasks[0]);
    tick();

    expect(console.error).toHaveBeenCalledWith('Error updating task:', jasmine.any(Error));
    expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to update task. Please try again.', 'Close', {
      duration: 3000,
    });
  }));

  it('should get random task and print it', fakeAsync(() => {
    spyOn(component, 'onPrintTask');

    component.onPrintRandomTask();
    tick();

    expect(taskService.getRandomTask).toHaveBeenCalled();
    expect(component.onPrintTask).toHaveBeenCalledWith(mockTasks[0]);
    expect(component.isLoadingRandom).toBeFalse();
  }));

  it('should handle random task error', fakeAsync(() => {
    spyOn(console, 'error');

    // Change getRandomTask to return an error
    taskService.getRandomTask.and.returnValue(throwError(() => new Error('No random task')));

    component.onPrintRandomTask();
    tick();

    expect(console.error).toHaveBeenCalledWith('Error getting random task:', jasmine.any(Error));
    expect(mockSnackBar.open).toHaveBeenCalledWith('No random task', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingRandom).toBeFalse();
  }));

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
});
