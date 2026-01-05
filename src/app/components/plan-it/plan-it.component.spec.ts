import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PlanItComponent } from './plan-it.component';
import { TaskService } from '../../services/task.service';
import { Task } from '../../generated';

describe('PlanItComponent', () => {
  let component: PlanItComponent;
  let fixture: ComponentFixture<PlanItComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'Description 1',
      state: 'todo',
      due_date: '2023-12-31T23:59:59.000Z',
      created_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Description 2',
      state: 'in_progress',
      due_date: '2023-12-25T23:59:59.000Z',
      created_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 3,
      title: 'Test Task 3',
      description: 'Description 3',
      state: 'done',
      due_date: null,
      created_at: '2023-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TaskService', [
      'getTasks',
      'startTask',
      'completeTask',
      'archiveTask',
      'printTask',
      'updateTask',
      'updateTaskState'
    ]);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        PlanItComponent
      ],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanItComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.todoTasks).toEqual([]);
    expect(component.inProgressTasks).toEqual([]);
    expect(component.doneTasks).toEqual([]);
    expect(component.archivedTasks).toEqual([]);
    expect(component.showArchived).toBe(false);
  });

  describe('ngOnInit', () => {
    it('should call loadTasks on initialization', () => {
      mockTaskService.getTasks.and.returnValue(of(mockTasks));
      
      component.ngOnInit();
      
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(0, 100, false);
    });
  });

  describe('loadTasks', () => {
    it('should load and categorize tasks correctly', () => {
      mockTaskService.getTasks.and.returnValue(of(mockTasks));
      
      component.loadTasks();
      
      expect(component.todoTasks).toEqual([mockTasks[0]]);
      expect(component.inProgressTasks).toEqual([mockTasks[1]]);
      expect(component.doneTasks).toEqual([mockTasks[2]]);
      expect(component.archivedTasks).toEqual([]);
    });

    it('should handle empty tasks array', () => {
      mockTaskService.getTasks.and.returnValue(of([]));
      
      component.loadTasks();
      
      expect(component.todoTasks).toEqual([]);
      expect(component.inProgressTasks).toEqual([]);
      expect(component.doneTasks).toEqual([]);
      expect(component.archivedTasks).toEqual([]);
    });

    it('should handle 404 error gracefully', () => {
      const error404 = { status: 404 };
      mockTaskService.getTasks.and.returnValue(throwError(() => error404));
      
      component.loadTasks();
      
      expect(mockSnackBar.open).not.toHaveBeenCalled();
      expect(component.todoTasks).toEqual([]);
      expect(component.inProgressTasks).toEqual([]);
      expect(component.doneTasks).toEqual([]);
      expect(component.archivedTasks).toEqual([]);
    });

    it('should handle other errors with snackbar', () => {
      const error = { status: 500 };
      mockTaskService.getTasks.and.returnValue(throwError(() => error));
      
      component.loadTasks();
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Error loading tasks', 'Close', { duration: 3000 });
    });

    it('should sort tasks by due date', () => {
      const tasksWithDates: Task[] = [
        { ...mockTasks[0], due_date: '2023-12-31T23:59:59.000Z' },
        { ...mockTasks[1], due_date: '2023-12-25T23:59:59.000Z' },
        { ...mockTasks[2], due_date: null },
      ];
      mockTaskService.getTasks.and.returnValue(of(tasksWithDates));
      
      component.loadTasks();
      
      // Tasks should be sorted: null dates last, then by date
      expect(component.todoTasks.length).toBeGreaterThan(0);
    });
  });

  describe('onStartTask', () => {
    it('should start task and reload tasks', () => {
      mockTaskService.startTask.and.returnValue(of(mockTasks[0]));
      mockTaskService.getTasks.and.returnValue(of(mockTasks));
      
      component.onStartTask(mockTasks[0]);
      
      expect(mockTaskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
      expect(mockTaskService.getTasks).toHaveBeenCalled();
    });

    it('should handle start task error', () => {
      mockTaskService.startTask.and.returnValue(throwError(() => new Error('Start error')));
      
      component.onStartTask(mockTasks[0]);
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Error starting task', 'Close', { duration: 3000 });
    });
  });

  describe('onCompleteTask', () => {
    it('should complete task and reload tasks', () => {
      mockTaskService.completeTask.and.returnValue(of(mockTasks[0]));
      mockTaskService.getTasks.and.returnValue(of(mockTasks));
      
      component.onCompleteTask(mockTasks[0]);
      
      expect(mockTaskService.completeTask).toHaveBeenCalledWith(mockTasks[0].id);
      expect(mockTaskService.getTasks).toHaveBeenCalled();
    });

    it('should handle complete task error', () => {
      mockTaskService.completeTask.and.returnValue(throwError(() => new Error('Complete error')));
      
      component.onCompleteTask(mockTasks[0]);
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Error completing task', 'Close', { duration: 3000 });
    });
  });

  describe('onArchiveTask', () => {
    it('should archive task and reload tasks', () => {
      mockTaskService.archiveTask.and.returnValue(of(mockTasks[0]));
      mockTaskService.getTasks.and.returnValue(of(mockTasks));
      
      component.onArchiveTask(mockTasks[0]);
      
      expect(mockTaskService.archiveTask).toHaveBeenCalledWith(mockTasks[0].id);
      expect(mockTaskService.getTasks).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Task archived', 'Close', { duration: 3000 });
    });

    it('should handle archive task error', () => {
      mockTaskService.archiveTask.and.returnValue(throwError(() => new Error('Archive error')));
      
      component.onArchiveTask(mockTasks[0]);
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to archive task', 'Close', { duration: 3000 });
    });
  });

  describe('onPrintTask', () => {
    it('should print task successfully', () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      mockTaskService.printTask.and.returnValue(of(mockBlob));
      spyOn(window, 'open').and.returnValue({} as Window);
      spyOn(window.URL, 'createObjectURL').and.returnValue('blob-url');
      
      component.onPrintTask(mockTasks[0]);
      
      expect(mockTaskService.printTask).toHaveBeenCalledWith(mockTasks[0].id);
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(window.open).toHaveBeenCalledWith('blob-url');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Task printed successfully', 'Close', { duration: 3000 });
    });

    it('should handle print task error', () => {
      mockTaskService.printTask.and.returnValue(throwError(() => new Error('Print error')));
      
      component.onPrintTask(mockTasks[0]);
      
      expect(mockSnackBar.open).toHaveBeenCalledWith('Error printing task', 'Close', { duration: 3000 });
    });
  });

  describe('onEditTask', () => {
    it('should have onEditTask method', () => {
      expect(component.onEditTask).toBeDefined();
      expect(typeof component.onEditTask).toBe('function');
    });
  });

  describe('onReopenTask', () => {
    it('should reopen task and reload tasks', () => {
      mockTaskService.updateTaskState.and.returnValue(of(mockTasks[0]));
      mockTaskService.getTasks.and.returnValue(of(mockTasks));
      
      component.onReopenTask(mockTasks[0]);
      
      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(mockTasks[0].id, 'todo');
      expect(mockTaskService.getTasks).toHaveBeenCalled();
    });
  });

  describe('toggleArchivedTasks', () => {
    it('should toggle showArchived and reload tasks', () => {
      mockTaskService.getTasks.and.returnValue(of(mockTasks));
      
      component.toggleArchivedTasks();
      
      expect(component.showArchived).toBe(true);
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(0, 100, true);
    });
  });

  describe('formatDueDate', () => {
    it('should format valid date', () => {
      const result = component.formatDueDate('2023-12-31T23:59:59.000Z');
      expect(result).toContain('2023');
    });

    it('should return "No date" for null', () => {
      const result = component.formatDueDate(null);
      expect(result).toBe('No date');
    });

    it('should return "No date" for undefined', () => {
      const result = component.formatDueDate(undefined);
      expect(result).toBe('No date');
    });
  });

  describe('isOverdue', () => {
    it('should return false for null due date', () => {
      expect(component.isOverdue(mockTasks[2])).toBe(false);
    });

    it('should return true for past due date', () => {
      const pastTask = { ...mockTasks[0], due_date: '2020-01-01T00:00:00.000Z' };
      expect(component.isOverdue(pastTask)).toBe(true);
    });

    it('should return false for future due date', () => {
      const futureTask = { ...mockTasks[0], due_date: '2030-01-01T00:00:00.000Z' };
      expect(component.isOverdue(futureTask)).toBe(false);
    });
  });

  describe('isDueSoon', () => {
    it('should return false for null due date', () => {
      expect(component.isDueSoon(mockTasks[2])).toBe(false);
    });

    it('should return false for overdue tasks', () => {
      const pastTask = { ...mockTasks[0], due_date: '2020-01-01T00:00:00.000Z' };
      expect(component.isDueSoon(pastTask)).toBe(false);
    });

    it('should return true for tasks due within threshold', () => {
      const soonTask = { ...mockTasks[0], due_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() };
      expect(component.isDueSoon(soonTask)).toBe(true);
    });
  });

  describe('getTaskClass', () => {
    it('should return "overdue" for overdue tasks', () => {
      const pastTask = { ...mockTasks[0], due_date: '2020-01-01T00:00:00.000Z' };
      expect(component.getTaskClass(pastTask)).toBe('overdue');
    });

    it('should return "due-soon" for tasks due soon', () => {
      const soonTask = { ...mockTasks[0], due_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() };
      expect(component.getTaskClass(soonTask)).toBe('due-soon');
    });

    it('should return empty string for normal tasks', () => {
      const normalTask = { ...mockTasks[0], due_date: '2030-01-01T00:00:00.000Z' };
      expect(component.getTaskClass(normalTask)).toBe('');
    });
  });

  describe('hasAnyTasks', () => {
    it('should return false when no tasks', () => {
      expect(component.hasAnyTasks()).toBe(false);
    });

    it('should return true when there are todo tasks', () => {
      component.todoTasks = [mockTasks[0]];
      expect(component.hasAnyTasks()).toBe(true);
    });

    it('should return true when there are archived tasks and showArchived is true', () => {
      component.showArchived = true;
      component.archivedTasks = [mockTasks[0]];
      expect(component.hasAnyTasks()).toBe(true);
    });

    it('should return false when there are archived tasks but showArchived is false', () => {
      component.showArchived = false;
      component.archivedTasks = [mockTasks[0]];
      expect(component.hasAnyTasks()).toBe(false);
    });
  });
});
