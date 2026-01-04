import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TaskService, Task, TaskCreate, TaskUpdate } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let loader: HarnessLoader;
  let taskService: jasmine.SpyObj<TaskService>;
  let authService: jasmine.SpyObj<AuthService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TaskFormComponent>>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    state: 'todo' as const,
    due_date: '2025-02-19T14:30:00Z',
    created_at: '2025-02-19T14:30:00Z',
    reward: 'Test Reward',
  };

  beforeEach(async () => {
    taskService = jasmine.createSpyObj('TaskService', ['createTask', 'updateTask']);
    authService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Set up default mock responses
    authService.getCurrentUser.and.returnValue({
      id: 1,
      email: 'test@example.com',
      is_active: true,
      is_admin: false,
      is_superadmin: false,
      avatar_url: null,
      last_login: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });
    taskService.createTask.and.returnValue(of({ ...mockTask }));
    taskService.updateTask.and.returnValue(of({ ...mockTask }));

    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: TaskService, useValue: taskService },
        { provide: AuthService, useValue: authService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty values', async () => {
    component.ngOnInit();
    fixture.detectChanges();

    const titleInput = await loader.getHarness(
      MatInputHarness.with({ selector: '[formControlName="title"]' })
    );
    const descInput = await loader.getHarness(
      MatInputHarness.with({ selector: '[formControlName="description"]' })
    );

    expect(await titleInput.getValue()).toBe('');
    expect(await descInput.getValue()).toBe('');
  });

  it('should validate required fields', async () => {
    component.ngOnInit();
    fixture.detectChanges();

    const submitButton = await loader.getHarness(
      MatButtonHarness.with({ selector: 'button[type="submit"]' })
    );
    await submitButton.click();

    expect(component.taskForm.get('title')?.errors?.['required']).toBeTruthy();
    expect(component.taskForm.get('description')?.errors?.['required']).toBeTruthy();
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      component.mode = 'create';
      component.task = undefined;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should submit valid form data', fakeAsync(async () => {
      const titleInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="title"]' })
      );
      const descInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="description"]' })
      );
      const submitButton = await loader.getHarness(
        MatButtonHarness.with({ selector: 'button[type="submit"]' })
      );

      await titleInput.setValue('New Task');
      await descInput.setValue('New Description');
      await submitButton.click();

      const expectedCreate: TaskCreate = {
        title: 'New Task',
        description: 'New Description',
        state: 'todo',
        due_date: undefined,
        reward: undefined,
        created_by: 1,
      };

      expect(taskService.createTask).toHaveBeenCalledWith(jasmine.objectContaining(expectedCreate));

      tick();

      expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining({ ...mockTask }));
      expect(snackBar.open).toHaveBeenCalledWith('Task added successfully', 'Close', {
        duration: 3000,
      });
    }));

    it('should handle API errors gracefully', fakeAsync(async () => {
      taskService.createTask.and.returnValue(throwError(() => new Error('API Error')));

      const titleInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="title"]' })
      );
      const descInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="description"]' })
      );
      const submitButton = await loader.getHarness(
        MatButtonHarness.with({ selector: 'button[type="submit"]' })
      );

      await titleInput.setValue('New Task');
      await descInput.setValue('New Description');
      await submitButton.click();

      tick();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Error adding task', 'Close', { duration: 3000 });
    }));
  });

  describe('Edit Mode', () => {
    let editMockTask: Task;

    beforeEach(() => {
      // Create a fresh copy of the mock task for each test
      editMockTask = { ...mockTask };
      component.mode = 'edit';
      component.task = editMockTask;
      component.ngOnInit();
      fixture.detectChanges();

      // Reset mock responses before each test
      taskService.updateTask.calls.reset();
    });

    it('should initialize form with existing task data', async () => {
      const titleInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="title"]' })
      );
      const descInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="description"]' })
      );

      expect(await titleInput.getValue()).toBe(editMockTask.title);
      expect(await descInput.getValue()).toBe(editMockTask.description);
    });

    it('should update task with modified title', fakeAsync(async () => {
      const titleInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="title"]' })
      );
      const submitButton = await loader.getHarness(
        MatButtonHarness.with({ selector: 'button[type="submit"]' })
      );

      await titleInput.setValue('Updated Task');

      // Create the expected update data (only changed fields)
      const changes: Partial<TaskUpdate> = {
        title: 'Updated Task',
      };

      // Create the mock response from the service with correct state type
      const updatedTask: Task = {
        ...editMockTask, // This includes the original state
        title: 'Updated Task',
      };
      taskService.updateTask.and.returnValue(of(updatedTask));

      await submitButton.click();
      tick(); // Wait for form submission

      // Verify update data sent to service (only changed fields)
      expect(taskService.updateTask).toHaveBeenCalledWith(
        editMockTask.id,
        jasmine.objectContaining(changes)
      );

      // Verify response handling
      expect(dialogRef.close).toHaveBeenCalledWith(jasmine.objectContaining(updatedTask));
      expect(snackBar.open).toHaveBeenCalledWith('Task updated successfully', 'Close', {
        duration: 3000,
      });
    }));

    it('should emit save event when not in dialog', fakeAsync(async () => {
      // Remove dialog ref to test component output
      Object.defineProperty(component, 'dialogRef', { value: undefined });
      spyOn(component.save, 'emit');

      const titleInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="title"]' })
      );
      const descInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="description"]' })
      );
      const submitButton = await loader.getHarness(
        MatButtonHarness.with({ selector: 'button[type="submit"]' })
      );

      await titleInput.setValue('Updated Task');
      await descInput.setValue('Updated Description');

      // Create the expected update data (only changed fields)
      const changes: Partial<TaskUpdate> = {
        title: 'Updated Task',
        description: 'Updated Description',
      };

      // Create the mock response from the service with correct state type
      const updatedTask: Task = {
        ...editMockTask, // Use the original task as base
        title: 'Updated Task',
        description: 'Updated Description',
      };

      taskService.updateTask.and.returnValue(of(updatedTask));

      await submitButton.click();
      tick(); // Wait for form submission

      // Verify update data sent to service (only changed fields)
      expect(taskService.updateTask).toHaveBeenCalledWith(
        editMockTask.id,
        jasmine.objectContaining(changes)
      );

      // Verify response handling with the original mock task state
      expect(component.save.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          id: editMockTask.id,
          title: 'Updated Task',
          description: 'Updated Description',
          state: editMockTask.state, // Use the original state
        })
      );
    }));

    it('should handle API errors gracefully', fakeAsync(async () => {
      taskService.updateTask.and.returnValue(throwError(() => new Error('API Error')));

      const titleInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="title"]' })
      );
      const submitButton = await loader.getHarness(
        MatButtonHarness.with({ selector: 'button[type="submit"]' })
      );

      await titleInput.setValue('Updated Task');
      await submitButton.click();

      tick();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Error updating task', 'Close', {
        duration: 3000,
      });
    }));

    it('should emit cancel event when cancel button is clicked', async () => {
      // Remove dialog ref to test component output
      Object.defineProperty(component, 'dialogRef', { value: undefined });
      spyOn(component.cancelled, 'emit');

      const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
      await cancelButton.click();

      expect(component.cancelled.emit).toHaveBeenCalled();
    });
  });
});
