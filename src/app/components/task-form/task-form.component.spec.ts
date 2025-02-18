import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<TaskFormComponent>>;

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', ['createTask']);
    taskServiceSpy.createTask.and.returnValue(
      of({ id: 1, title: 'Test Task', description: 'Test Description', state: 'todo' })
    );

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

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
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<TaskFormComponent>>;
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

  it('should validate required fields', () => {
    const form = component.taskForm;
    expect(form.valid).toBeFalse();

    form.patchValue({
      title: 'Test Task',
      description: 'Test Description',
    });

    expect(form.valid).toBeTrue();
  });

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

  it('should handle form cancellation', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
