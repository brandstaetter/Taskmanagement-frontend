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
  let mockTaskService: jest.Mocked<TaskService>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: { snapshot: { paramMap: { get: jest.SpyInstance } } };

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    state: 'todo',
    due_date: '2023-12-31T23:59:59.000Z',
    created_at: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockTaskService = {
      getTask: jest.fn(),
      updateTaskState: jest.fn(),
    } as unknown as jest.Mocked<TaskService>;
    mockRouter = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;
    const paramMap = { get: jest.fn().mockReturnValue('1') };
    mockActivatedRoute = { snapshot: { paramMap } };

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
    mockTaskService.getTask.mockReturnValue(of(mockTask));

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
      mockTaskService.updateTaskState.mockReturnValue(of(mockTask));

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
      mockTaskService.updateTaskState.mockReturnValue(of(mockTask));

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
      mockTaskService.updateTaskState.mockReturnValue(of(mockTask));

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
      // The date gets converted to local timezone, so check for the formatted time
      expect(result).toMatch(/\d{1,2}:\d{2}\s[AP]M/); // Should include time like "11:59 PM"
      expect(result).toMatch(/[A-Za-z]{3}\s\d{1,2}/); // Should include month and day like "Dec 31"
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
        in_progress: false,
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
      mockTaskService.updateTaskState.mockReturnValue(of(mockTask));

      component.onActionButtonClick(mockTask);

      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(mockTask.id, 'in_progress');
    });

    it('should call completeTask for in_progress tasks', () => {
      const inProgressTask = { ...mockTask, state: 'in_progress' as const };
      mockTaskService.updateTaskState.mockReturnValue(of(mockTask));

      component.onActionButtonClick(inProgressTask);

      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(inProgressTask.id, 'done');
    });
  });

  describe('ngOnInit', () => {
    it('should call refreshTask on initialization', () => {
      jest.spyOn(component as unknown as { refreshTask: () => void }, 'refreshTask');

      component.ngOnInit();

      expect((component as unknown as { refreshTask: () => void }).refreshTask).toHaveBeenCalled();
    });
  });

  describe('Component Structure', () => {
    it('should be provided in root', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Avatar display', () => {
    it('should show creator avatar image when creator_avatar_url is set', async () => {
      const taskWithAvatar: Task = {
        ...mockTask,
        creator_display_name: 'Alice',
        creator_avatar_url: 'https://gravatar.com/avatar/abc',
      };
      mockTaskService.getTask.mockReturnValue(of(taskWithAvatar));
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const avatarImg = fixture.nativeElement.querySelector('.user-avatar');
      expect(avatarImg).toBeTruthy();
      expect(avatarImg.src).toContain('gravatar.com');
    });

    it('should show person_outline icon when no creator avatar', async () => {
      const taskNoAvatar: Task = {
        ...mockTask,
        creator_display_name: 'Alice',
      };
      mockTaskService.getTask.mockReturnValue(of(taskNoAvatar));
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const avatarImg = fixture.nativeElement.querySelector('.user-avatar');
      expect(avatarImg).toBeNull();
    });

    it('should show worker avatar when worker_avatar_url is set', async () => {
      const taskWithWorker: Task = {
        ...mockTask,
        state: 'in_progress',
        worker_display_name: 'Bob',
        worker_avatar_url: 'https://gravatar.com/avatar/def',
      };
      mockTaskService.getTask.mockReturnValue(of(taskWithWorker));
      component.ngOnInit();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const avatars = fixture.nativeElement.querySelectorAll('.user-avatar');
      const workerAvatar = Array.from(avatars).find(
        (a: unknown) => (a as HTMLImageElement).src && (a as HTMLImageElement).src.includes('def')
      );
      expect(workerAvatar).toBeTruthy();
    });
  });
});
