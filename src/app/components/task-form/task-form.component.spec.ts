import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TaskService, Task } from '../../services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TaskFormComponent>>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    state: 'todo',
    due_date: '2025-02-19T14:30:00Z',
  };

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['createTask', 'updateTask']);
    taskServiceSpy.createTask.and.returnValue(of(mockTask));
    taskServiceSpy.updateTask.and.returnValue(of(mockTask));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        TaskFormComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        FormBuilder,
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<TaskFormComponent>>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with an empty form', () => {
    expect(component.taskForm.get('title')?.value).toBe('');
    expect(component.taskForm.get('description')?.value).toBe('');
    expect(component.taskForm.get('due_date')?.value).toBeNull();
    expect(component.taskForm.get('due_time')?.value).toBeNull();
    expect(component.taskForm.get('reward')?.value).toBe('');
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const form = component.taskForm;
      expect(form.valid).toBeFalse();

      form.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });

      expect(form.valid).toBeTrue();
    });

    it('should not submit form when invalid', () => {
      component.taskForm.patchValue({
        title: '',
        description: '',
      });

      component.onSubmit();

      expect(taskService.createTask).not.toHaveBeenCalled();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('Create Mode', () => {
    it('should submit form when valid', () => {
      const testTask = {
        title: 'Test Task',
        description: 'Test Description',
        reward: '10 points',
      };

      component.taskForm.patchValue(testTask);
      component.onSubmit();

      expect(taskService.createTask).toHaveBeenCalledWith(jasmine.objectContaining(testTask));
      expect(dialogRef.close).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Task added successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should handle create task error', () => {
      taskService.createTask.and.returnValue(throwError(() => new Error('API Error')));

      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });
      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith('Error adding task', 'Close', jasmine.any(Object));
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          TaskFormComponent,
          ReactiveFormsModule,
          HttpClientTestingModule,
          NoopAnimationsModule,
        ],
        providers: [
          FormBuilder,
          { provide: TaskService, useValue: taskService },
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: MatSnackBar, useValue: snackBar },
          { provide: MAT_DIALOG_DATA, useValue: mockTask },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TaskFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize form with task data', () => {
      expect(component.taskForm.get('title')?.value).toBe(mockTask.title);
      expect(component.taskForm.get('description')?.value).toBe(mockTask.description);
      expect(component.taskForm.get('due_date')?.value).toBeInstanceOf(Date);
      expect(component.taskForm.get('due_time')?.value).toBeInstanceOf(Date);
    });

    it('should update task when form is submitted', () => {
      const updatedTask = {
        title: 'Updated Task',
        description: 'Updated Description',
      };

      component.taskForm.patchValue(updatedTask);
      component.onSubmit();

      expect(taskService.updateTask).toHaveBeenCalledWith(mockTask.id, jasmine.any(Object));
      expect(dialogRef.close).toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'Task updated successfully',
        'Close',
        jasmine.any(Object)
      );
    });

    it('should handle update task error', () => {
      taskService.updateTask.and.returnValue(throwError(() => new Error('API Error')));

      component.taskForm.patchValue({
        title: 'Updated Task',
        description: 'Updated Description',
      });
      component.onSubmit();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Error updating task',
        'Close',
        jasmine.any(Object)
      );
    });
  });

  describe('Date and Time Handling', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-02-19T14:15:00Z'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should round up time to next interval', () => {
      component.prefillCurrentTime();
      const timeControl = component.taskForm.get('due_time');
      expect(timeControl?.value.getMinutes()).toBe(30);
    });

    it('should prefill current time', () => {
      component.prefillCurrentTime();
      const timeControl = component.taskForm.get('due_time');
      const dateControl = component.taskForm.get('due_date');

      expect(timeControl?.value).toBeInstanceOf(Date);
      expect(dateControl?.value).toBeInstanceOf(Date);
      expect(timeControl?.value.getMinutes() % 30).toBe(0);
    });

    it('should prefill end of day', () => {
      component.prefillEndOfDay();
      const dateControl = component.taskForm.get('due_date');
      const timeControl = component.taskForm.get('due_time');

      expect(dateControl?.value).toBeInstanceOf(Date);
      expect(timeControl?.value).toBeInstanceOf(Date);
      expect(dateControl?.value.getHours()).toBe(23);
      expect(dateControl?.value.getMinutes()).toBe(30);
    });

    it('should update date time when both date and time are set', fakeAsync(() => {
      const date = new Date('2025-02-19T00:00:00');
      const time = new Date('2025-02-19T14:30:00');

      component.taskForm.patchValue({
        due_date: date,
        due_time: time,
      });

      // Allow time for form value changes to propagate
      tick();

      const combinedDate = component.taskForm.get('due_date')?.value;
      expect(combinedDate.getHours()).toBe(time.getHours());
      expect(combinedDate.getMinutes()).toBe(time.getMinutes());
    }));
  });

  describe('Dialog Integration', () => {
    it('should initialize with dialog data if provided', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          TaskFormComponent,
          ReactiveFormsModule,
          HttpClientTestingModule,
          NoopAnimationsModule,
        ],
        providers: [
          FormBuilder,
          {
            provide: TaskService,
            useValue: jasmine.createSpyObj('TaskService', ['createTask', 'updateTask']),
          },
          { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
          { provide: MAT_DIALOG_DATA, useValue: mockTask },
        ],
      }).compileComponents();

      const dialogFixture = TestBed.createComponent(TaskFormComponent);
      const dialogComponent = dialogFixture.componentInstance;
      dialogFixture.detectChanges();

      expect(dialogComponent.task).toBeTruthy();
      expect(dialogComponent.mode).toBe('edit');
    });

    it('should emit save event when not in dialog mode', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          TaskFormComponent,
          ReactiveFormsModule,
          HttpClientTestingModule,
          NoopAnimationsModule,
        ],
        providers: [
          FormBuilder,
          { provide: TaskService, useValue: taskService },
          { provide: MatSnackBar, useValue: snackBar },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TaskFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      spyOn(component.save, 'emit');
      component.taskForm.patchValue({
        title: 'Test Task',
        description: 'Test Description',
      });
      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith(jasmine.any(Object));
    });

    it('should emit cancel event when not in dialog mode', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [
          TaskFormComponent,
          ReactiveFormsModule,
          HttpClientTestingModule,
          NoopAnimationsModule,
        ],
        providers: [
          FormBuilder,
          { provide: TaskService, useValue: taskService },
          { provide: MatSnackBar, useValue: snackBar },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TaskFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      spyOn(component.cancelled, 'emit');
      component.onCancel();
      expect(component.cancelled.emit).toHaveBeenCalled();
    });
  });
});
