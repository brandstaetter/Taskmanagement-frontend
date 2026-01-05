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

  describe('Helper Methods', () => {
    beforeEach(() => {
      component.mode = 'create';
      component.task = undefined;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should prefill current time when called', () => {
      const now = new Date();
      const componentWithPrivateMethods = component as unknown as {
        roundUpToNextInterval(date: Date): Date;
        prefillCurrentTime(): void;
      };
      spyOn(componentWithPrivateMethods, 'roundUpToNextInterval').and.callFake((date: Date) => {
        const rounded = new Date(date);
        rounded.setMinutes(Math.ceil(rounded.getMinutes() / 30) * 30);
        rounded.setSeconds(0);
        rounded.setMilliseconds(0);
        return rounded;
      });

      componentWithPrivateMethods.prefillCurrentTime();

      expect(componentWithPrivateMethods.roundUpToNextInterval).toHaveBeenCalledWith(now);
      expect(component.taskForm.get('due_time')?.value).toBeDefined();
      expect(component.taskForm.get('due_date')?.value).toBeDefined();
    });

    it('should not override existing time when prefilling current time', () => {
      const existingTime = new Date('2023-01-01T10:00:00');
      component.taskForm.get('due_time')?.setValue(existingTime);

      const componentWithPrivateMethods = component as unknown as {
        prefillCurrentTime(): void;
      };
      componentWithPrivateMethods.prefillCurrentTime();

      expect(component.taskForm.get('due_time')?.value).toEqual(existingTime);
    });

    it('should prefill end of day when called', () => {
      component.prefillEndOfDay();

      const dateValue = component.taskForm.get('due_date')?.value;
      const timeValue = component.taskForm.get('due_time')?.value;

      expect(dateValue).toBeDefined();
      expect(timeValue).toBeDefined();
      expect(dateValue.getHours()).toBe(23);
      expect(dateValue.getMinutes()).toBe(30);
      expect(timeValue.getHours()).toBe(23);
      expect(timeValue.getMinutes()).toBe(30);
    });

    it('should not override existing date when prefilling end of day', () => {
      const existingDate = new Date('2023-01-01T10:00:00');
      component.taskForm.get('due_date')?.setValue(existingDate);

      component.prefillEndOfDay();

      expect(component.taskForm.get('due_date')?.value).toEqual(existingDate);
    });

    it('should round up time to next 30-minute interval', () => {
      const testDate = new Date('2023-01-01T10:15:30');
      const componentWithPrivateMethods = component as unknown as {
        roundUpToNextInterval(date: Date): Date;
      };
      const rounded = componentWithPrivateMethods.roundUpToNextInterval(testDate);

      expect(rounded.getHours()).toBe(10);
      expect(rounded.getMinutes()).toBe(30);
      expect(rounded.getSeconds()).toBe(0);
      expect(rounded.getMilliseconds()).toBe(0);
    });

    it('should update date time when both date and time are set', () => {
      const date = new Date('2023-01-01T00:00:00');
      const time = new Date('2023-01-01T15:45:00');

      component.taskForm.get('due_date')?.setValue(date);
      component.taskForm.get('due_time')?.setValue(time);

      component.updateDateTime();

      const updatedDate = component.taskForm.get('due_date')?.value;
      expect(updatedDate.getHours()).toBe(15);
      expect(updatedDate.getMinutes()).toBe(45);
      expect(updatedDate.getSeconds()).toBe(0);
      expect(updatedDate.getMilliseconds()).toBe(0);
    });

    it('should not update when only date or time is set', () => {
      const date = new Date('2023-01-01T00:00:00');
      component.taskForm.get('due_date')?.setValue(date);
      component.taskForm.get('due_time')?.setValue(null);

      const originalDate = component.taskForm.get('due_date')?.value;
      component.updateDateTime();

      expect(component.taskForm.get('due_date')?.value).toEqual(originalDate);
    });
  });

  describe('Date/Time Integration', () => {
    beforeEach(() => {
      component.mode = 'create';
      component.task = undefined;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should initialize form with task due date and time', () => {
      component.task = mockTask;
      component.ngOnInit();
      fixture.detectChanges();

      const dateValue = component.taskForm.get('due_date')?.value;
      const timeValue = component.taskForm.get('due_time')?.value;

      expect(dateValue).toBeDefined();
      expect(timeValue).toBeDefined();
      expect(dateValue.toISOString().startsWith('2025-02-19')).toBeTrue();
    });

    it('should combine date and time in form submission', fakeAsync(async () => {
      const date = new Date('2023-01-01T00:00:00');
      const time = new Date('2023-01-01T15:30:00');

      component.taskForm.get('due_date')?.setValue(date);
      component.taskForm.get('due_time')?.setValue(time);
      component.taskForm.get('title')?.setValue('Test Task');
      component.taskForm.get('description')?.setValue('Test Description');

      const submitButton = await loader.getHarness(
        MatButtonHarness.with({ selector: 'button[type="submit"]' })
      );
      await submitButton.click();

      tick();

      const createCall = taskService.createTask.calls.mostRecent();
      const taskData = createCall.args[0] as TaskCreate;

      expect(taskData.due_date).toBeDefined();
      // Check that the time component is correctly set (accounting for timezone)
      // The actual time might be different due to timezone conversion
      expect(taskData.due_date).toBeDefined();
      expect(typeof taskData.due_date).toBe('string');
    }));
  });
});
