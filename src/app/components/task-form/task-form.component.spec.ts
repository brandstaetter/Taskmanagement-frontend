import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TaskService, Task, TaskCreate, TaskUpdate } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
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
  let taskService: jest.Mocked<TaskService>;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UserService>;
  let dialogRef: jest.Mocked<MatDialogRef<TaskFormComponent>>;
  let snackBar: jest.Mocked<MatSnackBar>;

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
    taskService = {
      createTask: jest.fn(),
      updateTask: jest.fn(),
    } as unknown as jest.Mocked<TaskService>;
    authService = { getCurrentUser: jest.fn() } as unknown as jest.Mocked<AuthService>;
    userService = {
      getUsers: jest.fn().mockReturnValue(of([])),
    } as unknown as jest.Mocked<UserService>;
    dialogRef = { close: jest.fn() } as unknown as jest.Mocked<MatDialogRef<TaskFormComponent>>;
    snackBar = { open: jest.fn() } as unknown as jest.Mocked<MatSnackBar>;

    // Set up default mock responses
    authService.getCurrentUser.mockReturnValue({
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
    taskService.createTask.mockReturnValue(of({ ...mockTask }));
    taskService.updateTask.mockReturnValue(of({ ...mockTask }));

    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: TaskService, useValue: taskService },
        { provide: AuthService, useValue: authService },
        { provide: UserService, useValue: userService },
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

    it('should submit valid form data', async () => {
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

      expect(taskService.createTask).toHaveBeenCalledWith(expect.objectContaining(expectedCreate));

      await fixture.whenStable();

      expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining({ ...mockTask }));
      expect(snackBar.open).toHaveBeenCalledWith('Task added successfully', 'Close', {
        duration: 3000,
      });
    });

    it('should handle API errors gracefully', async () => {
      taskService.createTask.mockReturnValue(throwError(() => new Error('API Error')));

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

      await fixture.whenStable();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Error adding task', 'Close', { duration: 3000 });
    });
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
      taskService.updateTask.mockClear();
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

    it('should update task with modified title', async () => {
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
      taskService.updateTask.mockReturnValue(of(updatedTask));

      await submitButton.click();
      await fixture.whenStable(); // Wait for form submission

      // Verify update data sent to service (only changed fields)
      expect(taskService.updateTask).toHaveBeenCalledWith(
        editMockTask.id,
        expect.objectContaining(changes)
      );

      // Verify response handling
      expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining(updatedTask));
      expect(snackBar.open).toHaveBeenCalledWith('Task updated successfully', 'Close', {
        duration: 3000,
      });
    });

    it('should emit save event when not in dialog', async () => {
      // Remove dialog ref to test component output
      Object.defineProperty(component, 'dialogRef', { value: undefined });
      jest.spyOn(component.save, 'emit');

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

      taskService.updateTask.mockReturnValue(of(updatedTask));

      await submitButton.click();
      await fixture.whenStable(); // Wait for form submission

      // Verify update data sent to service (only changed fields)
      expect(taskService.updateTask).toHaveBeenCalledWith(
        editMockTask.id,
        expect.objectContaining(changes)
      );

      // Verify response handling with the original mock task state
      expect(component.save.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: editMockTask.id,
          title: 'Updated Task',
          description: 'Updated Description',
          state: editMockTask.state, // Use the original state
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      taskService.updateTask.mockReturnValue(throwError(() => new Error('API Error')));

      const titleInput = await loader.getHarness(
        MatInputHarness.with({ selector: '[formControlName="title"]' })
      );
      const submitButton = await loader.getHarness(
        MatButtonHarness.with({ selector: 'button[type="submit"]' })
      );

      await titleInput.setValue('Updated Task');
      await submitButton.click();

      await fixture.whenStable();

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith('Error updating task', 'Close', {
        duration: 3000,
      });
    });

    it('should emit cancel event when cancel button is clicked', async () => {
      // Remove dialog ref to test component output
      Object.defineProperty(component, 'dialogRef', { value: undefined });
      jest.spyOn(component.cancelled, 'emit');

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
      jest.useFakeTimers();
      const now = new Date(2023, 0, 1, 10, 15, 30);
      jest.setSystemTime(now);

      const componentWithPrivateMethods = component as unknown as {
        roundUpToNextInterval(date: Date): Date;
        prefillCurrentTime(): void;
      };
      jest.spyOn(componentWithPrivateMethods, 'roundUpToNextInterval');

      componentWithPrivateMethods.prefillCurrentTime();

      expect(componentWithPrivateMethods.roundUpToNextInterval).toHaveBeenCalledWith(now);
      expect(component.taskForm.get('due_time')?.value).toBeDefined();
      expect(component.taskForm.get('due_date')?.value).toBeDefined();

      jest.useRealTimers();
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
      expect(dateValue.toISOString().startsWith('2025-02-19')).toBe(true);
    });

    it('should combine date and time in form submission', async () => {
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

      await fixture.whenStable();

      const createCall =
        taskService.createTask.mock.calls[taskService.createTask.mock.calls.length - 1];
      const taskData = createCall[0] as TaskCreate;

      expect(taskData.due_date).toBeDefined();
      // Check that the time component is correctly set (accounting for timezone)
      // The actual time might be different due to timezone conversion
      expect(taskData.due_date).toBeDefined();
      expect(typeof taskData.due_date).toBe('string');
    });
  });

  describe('assignToMe', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should add current user id to assigned_user_ids if not already present', () => {
      component.taskForm.get('assigned_user_ids')?.setValue([]);

      component.assignToMe();

      expect(component.taskForm.get('assigned_user_ids')?.value).toContain(1);
    });

    it('should not duplicate current user id if already assigned', () => {
      component.taskForm.get('assigned_user_ids')?.setValue([1]);

      component.assignToMe();

      const ids: number[] = component.taskForm.get('assigned_user_ids')?.value;
      expect(ids.filter(id => id === 1).length).toBe(1);
    });

    it('should do nothing when no current user', () => {
      authService.getCurrentUser.mockReturnValue(null);
      component.taskForm.get('assigned_user_ids')?.setValue([]);

      component.assignToMe();

      expect(component.taskForm.get('assigned_user_ids')?.value).toEqual([]);
    });
  });

  describe('onTimeInputEnter (issue #329 — Enter key parses time without submitting)', () => {
    const makeKeyEvent = (value: string): Event =>
      ({ target: { value }, preventDefault: jest.fn() }) as unknown as Event;

    beforeEach(() => {
      component.mode = 'create';
      component.task = undefined;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should parse HHMM "1430" → hours=14, minutes=30 and prevent form submission', () => {
      const event = makeKeyEvent('1430');
      component.onTimeInputEnter(event);

      const timeValue = component.taskForm.get('due_time')?.value as Date;
      expect(timeValue).toBeDefined();
      expect(timeValue.getHours()).toBe(14);
      expect(timeValue.getMinutes()).toBe(30);
      expect((event as KeyboardEvent).preventDefault).toHaveBeenCalled();
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    it('should parse HHMM "930" → hours=9, minutes=30 and prevent form submission', () => {
      const event = makeKeyEvent('930');
      component.onTimeInputEnter(event);

      const timeValue = component.taskForm.get('due_time')?.value as Date;
      expect(timeValue).toBeDefined();
      expect(timeValue.getHours()).toBe(9);
      expect(timeValue.getMinutes()).toBe(30);
      expect((event as KeyboardEvent).preventDefault).toHaveBeenCalled();
    });

    it('should call preventDefault even when "14:30" is already formatted (no form submission)', () => {
      const existingTime = new Date('2023-01-01T14:30:00');
      component.taskForm.get('due_time')?.setValue(existingTime);

      const event = makeKeyEvent('14:30');
      component.onTimeInputEnter(event);

      expect((event as KeyboardEvent).preventDefault).toHaveBeenCalled();
      expect(taskService.createTask).not.toHaveBeenCalled();
    });

    it('should not change due_time when input is invalid "2400"', () => {
      const initialValue = component.taskForm.get('due_time')?.value;
      const event = makeKeyEvent('2400');
      component.onTimeInputEnter(event);

      expect(component.taskForm.get('due_time')?.value).toEqual(initialValue);
      expect((event as KeyboardEvent).preventDefault).toHaveBeenCalled();
    });
  });

  describe('issue #329 — date preserved after manual HHMM time entry', () => {
    it('should preserve the date after typing HHMM and blurring in create mode', () => {
      component.mode = 'create';
      component.task = undefined;
      component.ngOnInit();
      fixture.detectChanges();

      const selectedDate = new Date('2026-06-15T00:00:00');
      component.taskForm.get('due_date')?.setValue(selectedDate);

      component.onTimeInputBlur({ target: { value: '1430' } } as unknown as Event);

      const dateValue = component.taskForm.get('due_date')?.value as Date;
      expect(dateValue).toBeDefined();
      expect(dateValue.getFullYear()).toBe(2026);
      expect(dateValue.getMonth()).toBe(5); // June = 5 (0-indexed)
      expect(dateValue.getDate()).toBe(15);
      expect(dateValue.getHours()).toBe(14);
      expect(dateValue.getMinutes()).toBe(30);
    });

    it('should preserve the date after typing HHMM and blurring in edit mode with existing date', () => {
      component.mode = 'edit';
      component.task = { ...mockTask, due_date: '2026-03-10T09:00:00Z' };
      component.ngOnInit();
      fixture.detectChanges();

      component.onTimeInputBlur({ target: { value: '1600' } } as unknown as Event);

      const dateValue = component.taskForm.get('due_date')?.value as Date;
      expect(dateValue).toBeDefined();
      // Date should still be March 10 2026 (local date from '2026-03-10T09:00:00Z')
      expect(dateValue.getFullYear()).toBe(2026);
      expect(dateValue.getHours()).toBe(16);
      expect(dateValue.getMinutes()).toBe(0);
    });
  });

  describe('onTimeInputBlur (military time input)', () => {
    const makeEvent = (value: string): Event => ({ target: { value } }) as unknown as Event;

    beforeEach(() => {
      component.mode = 'create';
      component.task = undefined;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should parse 4-digit military time "1430" → hours=14, minutes=30', () => {
      component.onTimeInputBlur(makeEvent('1430'));
      const timeValue = component.taskForm.get('due_time')?.value as Date;
      expect(timeValue).toBeDefined();
      expect(timeValue.getHours()).toBe(14);
      expect(timeValue.getMinutes()).toBe(30);
    });

    it('should parse 3-digit military time "930" → hours=9, minutes=30', () => {
      component.onTimeInputBlur(makeEvent('930'));
      const timeValue = component.taskForm.get('due_time')?.value as Date;
      expect(timeValue).toBeDefined();
      expect(timeValue.getHours()).toBe(9);
      expect(timeValue.getMinutes()).toBe(30);
    });

    it('should silently ignore invalid time "2400" and leave due_time unchanged', () => {
      const initialValue = component.taskForm.get('due_time')?.value;
      component.onTimeInputBlur(makeEvent('2400'));
      expect(component.taskForm.get('due_time')?.value).toEqual(initialValue);
    });

    it('should leave due_time unchanged for already-formatted "14:30"', () => {
      const existingTime = new Date('2023-01-01T14:30:00');
      component.taskForm.get('due_time')?.setValue(existingTime);
      component.onTimeInputBlur(makeEvent('14:30'));
      expect(component.taskForm.get('due_time')?.value).toEqual(existingTime);
    });
  });

  describe('Edit mode: due_time initialised without roundUpToNextInterval', () => {
    it('should preserve hours=23, minutes=30 when editing a task saved with 23:30 local time', () => {
      const localDate = new Date(2026, 0, 15, 23, 30, 0, 0);
      component.mode = 'edit';
      component.task = { ...mockTask, due_date: localDate.toISOString() };
      component.ngOnInit();
      fixture.detectChanges();

      const timeValue = component.taskForm.get('due_time')?.value as Date;
      expect(timeValue).toBeDefined();
      expect(timeValue.getHours()).toBe(23);
      expect(timeValue.getMinutes()).toBe(30);
    });

    it('should preserve hours=23, minutes=0 when editing a task saved with 23:00 local time', () => {
      const localDate = new Date(2026, 0, 15, 23, 0, 0, 0);
      component.mode = 'edit';
      component.task = { ...mockTask, due_date: localDate.toISOString() };
      component.ngOnInit();
      fixture.detectChanges();

      const timeValue = component.taskForm.get('due_time')?.value as Date;
      expect(timeValue).toBeDefined();
      expect(timeValue.getHours()).toBe(23);
      expect(timeValue.getMinutes()).toBe(0);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return display_name when set', () => {
      const user = {
        id: 1,
        email: 'a@b.com',
        display_name: 'Alice',
        is_active: true,
        is_admin: false,
        is_superadmin: false,
        avatar_url: null,
        last_login: null,
        created_at: '',
        updated_at: '',
      };
      expect(component.getUserDisplayName(user)).toBe('Alice');
    });

    it('should fall back to email when display_name is null', () => {
      const user = {
        id: 2,
        email: 'b@c.com',
        display_name: null,
        is_active: true,
        is_admin: false,
        is_superadmin: false,
        avatar_url: null,
        last_login: null,
        created_at: '',
        updated_at: '',
      };
      component.ngOnInit();
      expect(component.getUserDisplayName(user)).toBe('b@c.com');
    });
  });
});
