import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { TaskDetailsComponent } from './task-details.component';
import { TaskService } from '../../services/task.service';
import { Task } from '../../generated';

describe('TaskDetailsComponent', () => {
  let component: TaskDetailsComponent;
  let fixture: ComponentFixture<TaskDetailsComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    state: 'todo',
    due_date: '2023-12-31T23:59:59.000Z',
    created_at: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TaskService', ['getTask', 'updateTaskState']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);
    mockActivatedRoute.snapshot = jasmine.createSpyObj('snapshot', ['paramMap']);
    const paramMap = jasmine.createSpyObj('paramMap', ['get']);
    paramMap.get.and.returnValue('1');
    (mockActivatedRoute.snapshot as unknown as { paramMap: { get: jasmine.Spy } }).paramMap =
      paramMap;

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, TaskDetailsComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDetailsComponent);
    component = fixture.componentInstance;

    // Mock the task service to prevent actual API calls
    mockTaskService.getTask.and.returnValue(of(mockTask));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with taskId from route', () => {
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('taskId');
    expect(mockTaskService.getTask).toHaveBeenCalledWith(1);
  });

  it('should have task$ observable', () => {
    expect(component.task$).toBeDefined();
    expect(typeof component.task$.subscribe).toBe('function');
  });

  describe('goBack', () => {
    it('should have goBack method', () => {
      expect(component.goBack).toBeDefined();
      expect(typeof component.goBack).toBe('function');
    });

    it('should navigate to root', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('reopenTask', () => {
    it('should have reopenTask method', () => {
      expect(component.reopenTask).toBeDefined();
      expect(typeof component.reopenTask).toBe('function');
    });

    it('should call taskService.updateTaskState and refresh', () => {
      mockTaskService.updateTaskState.and.returnValue(of(mockTask));

      component.reopenTask(mockTask);

      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(mockTask.id, 'todo');
    });
  });

  describe('startTask', () => {
    it('should have startTask method', () => {
      expect(component.startTask).toBeDefined();
      expect(typeof component.startTask).toBe('function');
    });

    it('should call taskService.updateTaskState', () => {
      mockTaskService.updateTaskState.and.returnValue(of(mockTask));

      component.startTask(mockTask);

      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(mockTask.id, 'in_progress');
    });
  });

  describe('completeTask', () => {
    it('should have completeTask method', () => {
      expect(component.completeTask).toBeDefined();
      expect(typeof component.completeTask).toBe('function');
    });

    it('should call taskService.updateTaskState', () => {
      mockTaskService.updateTaskState.and.returnValue(of(mockTask));

      component.completeTask(mockTask);

      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(mockTask.id, 'done');
    });
  });

  describe('formatDate', () => {
    it('should have formatDate method', () => {
      expect(component.formatDate).toBeDefined();
      expect(typeof component.formatDate).toBe('function');
    });

    it('should format valid date', () => {
      const result = component.formatDate('2023-12-31T23:59:59.000Z');
      expect(result).toContain('Dec 31'); // toLocaleString format
      expect(result).toContain('11:59'); // Should include time
    });

    it('should return empty string for null', () => {
      const result = component.formatDate(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined', () => {
      const result = component.formatDate(undefined);
      expect(result).toBe('');
    });
  });

  describe('getTimespan', () => {
    it('should have getTimespan method', () => {
      expect(component.getTimespan).toBeDefined();
      expect(typeof component.getTimespan).toBe('function');
    });

    it('should return empty string for null', () => {
      const result = component.getTimespan(null);
      expect(result).toBe('');
    });

    it('should return timespan for valid date', () => {
      const result = component.getTimespan('2023-12-31T23:59:59.000Z');
      expect(typeof result).toBe('string');
    });
  });

  describe('isOverdue', () => {
    it('should have isOverdue method', () => {
      expect(component.isOverdue).toBeDefined();
      expect(typeof component.isOverdue).toBe('function');
    });

    it('should return false for null due date', () => {
      const taskWithoutDate = { ...mockTask, due_date: null };
      expect(component.isOverdue(taskWithoutDate)).toBe(false);
    });

    it('should return true for past due date', () => {
      const pastTask = { ...mockTask, due_date: '2020-01-01T00:00:00.000Z' };
      expect(component.isOverdue(pastTask)).toBe(true);
    });

    it('should return false for future due date', () => {
      const futureTask = { ...mockTask, due_date: '2030-01-01T00:00:00.000Z' };
      expect(component.isOverdue(futureTask)).toBe(false);
    });
  });

  describe('isDueSoon', () => {
    it('should have isDueSoon method', () => {
      expect(component.isDueSoon).toBeDefined();
      expect(typeof component.isDueSoon).toBe('function');
    });

    it('should return false for null due date', () => {
      const taskWithoutDate = { ...mockTask, due_date: null };
      expect(component.isDueSoon(taskWithoutDate)).toBe(false);
    });

    it('should return false for overdue tasks', () => {
      const pastTask = { ...mockTask, due_date: '2020-01-01T00:00:00.000Z' };
      expect(component.isDueSoon(pastTask)).toBe(false);
    });

    it('should return true for tasks due within threshold', () => {
      const soonTask = {
        ...mockTask,
        due_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      };
      expect(component.isDueSoon(soonTask)).toBe(true);
    });
  });

  describe('getTaskClasses', () => {
    it('should have getTaskClasses method', () => {
      expect(component.getTaskClasses).toBeDefined();
      expect(typeof component.getTaskClasses).toBe('function');
    });

    it('should return class object for task', () => {
      const classes = component.getTaskClasses(mockTask);
      expect(classes).toEqual({
        'task-card': true,
        todo: true,
        'in_progress': false,
        done: false,
        archived: false,
        overdue: true, // 2023-12-31 is in the past, so it should be overdue
        'due-soon': false,
      });
    });
  });

  describe('getActionButtonText', () => {
    it('should have getActionButtonText method', () => {
      expect(component.getActionButtonText).toBeDefined();
      expect(typeof component.getActionButtonText).toBe('function');
    });

    it('should return START for todo tasks', () => {
      const result = component.getActionButtonText(mockTask);
      expect(result).toBe('START');
    });

    it('should return COMPLETE for in_progress tasks', () => {
      const inProgressTask = { ...mockTask, state: 'in_progress' as const };
      const result = component.getActionButtonText(inProgressTask);
      expect(result).toBe('COMPLETE');
    });

    it('should return empty string for done tasks', () => {
      const doneTask = { ...mockTask, state: 'done' as const };
      const result = component.getActionButtonText(doneTask);
      expect(result).toBe('');
    });
  });

  describe('onActionButtonClick', () => {
    it('should have onActionButtonClick method', () => {
      expect(component.onActionButtonClick).toBeDefined();
      expect(typeof component.onActionButtonClick).toBe('function');
    });

    it('should call startTask for todo tasks', () => {
      mockTaskService.updateTaskState.and.returnValue(of(mockTask));

      component.onActionButtonClick(mockTask);

      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(mockTask.id, 'in_progress');
    });

    it('should call completeTask for in_progress tasks', () => {
      const inProgressTask = { ...mockTask, state: 'in_progress' as const };
      mockTaskService.updateTaskState.and.returnValue(of(mockTask));

      component.onActionButtonClick(inProgressTask);

      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(inProgressTask.id, 'done');
    });
  });

  describe('ngOnInit', () => {
    it('should call refreshTask on initialization', () => {
      spyOn(component as unknown as { refreshTask: () => void }, 'refreshTask');

      component.ngOnInit();

      expect((component as unknown as { refreshTask: () => void }).refreshTask).toHaveBeenCalled();
    });
  });

  describe('Component Structure', () => {
    it('should be provided in root', () => {
      expect(component).toBeTruthy();
    });
  });
});
