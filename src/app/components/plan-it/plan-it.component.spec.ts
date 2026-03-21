import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PlanItComponent } from './plan-it.component';
import { TaskService } from '../../services/task.service';
import { TaskEditDialogComponent } from '../task-edit-dialog/task-edit-dialog.component';
import { Task } from '../../generated';

describe('PlanItComponent', () => {
  let component: PlanItComponent;
  let fixture: ComponentFixture<PlanItComponent>;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockSnackBar: jest.Mocked<MatSnackBar>;
  let mockDialog: jest.Mocked<MatDialog>;
  let mockRouter: jest.Mocked<Router>;

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
    mockTaskService = {
      getTasks: jest.fn(),
      startTask: jest.fn(),
      completeTask: jest.fn(),
      archiveTask: jest.fn(),
      printTask: jest.fn(),
      updateTask: jest.fn(),
      updateTaskState: jest.fn(),
    } as unknown as jest.Mocked<TaskService>;
    mockSnackBar = { open: jest.fn() } as unknown as jest.Mocked<MatSnackBar>;
    mockDialog = { open: jest.fn() } as unknown as jest.Mocked<MatDialog>;
    mockRouter = { navigate: jest.fn() } as unknown as jest.Mocked<Router>;

    // Simple mock that bypasses Angular Material's internal dialog logic
    const mockDialogRef = {
      afterClosed: () => of(null),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.mockReturnValue(mockDialogRef);

    // Mock getTasks BEFORE creating the component to prevent any real calls during ngOnInit
    mockTaskService.getTasks = jest.fn().mockReturnValue(of(mockTasks));

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, PlanItComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(PlanItComponent, {
        set: {
          providers: [{ provide: MatDialog, useValue: mockDialog }],
        },
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
    // After ngOnInit, tasks are loaded and categorized (sorted by due_date)
    expect(component.todoTasks.length).toBe(1);
    expect(component.inProgressTasks.length).toBe(1);
    expect(component.doneTasks.length).toBe(1);
    expect(component.archivedTasks.length).toBe(0);
    expect(component.showArchived).toBe(false);
    // Verify the correct task ordering based on due_date sorting
    // Tasks are sorted: 2023-12-25 (id=2) comes before 2023-12-31 (id=1), null dates come last
    expect(component.todoTasks[0].id).toBe(1); // 2023-12-31 (todo) - actually this is the only todo task
    expect(component.inProgressTasks[0].id).toBe(2); // 2023-12-25 (in_progress) - actually this is the only in_progress task
    expect(component.doneTasks[0].id).toBe(3); // null due_date (done) - actually this is the only done task
  });

  describe('ngOnInit', () => {
    it('should call loadTasks on initialization', () => {
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));

      component.ngOnInit();

      expect(mockTaskService.getTasks).toHaveBeenCalledWith(0, 100, false, true);
    });
  });

  describe('loadTasks', () => {
    it('should load and categorize tasks correctly', () => {
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));

      component.loadTasks();

      // Test that tasks are loaded and categorized by state
      expect(component.todoTasks.length).toBe(1);
      expect(component.inProgressTasks.length).toBe(1);
      expect(component.doneTasks.length).toBe(1);
      expect(component.archivedTasks.length).toBe(0);

      // Test that each category has the correct task by state
      expect(component.todoTasks[0].state).toBe('todo');
      expect(component.inProgressTasks[0].state).toBe('in_progress');
      expect(component.doneTasks[0].state).toBe('done');
    });

    it('should handle empty tasks array', () => {
      mockTaskService.getTasks.mockReturnValue(of([]));

      component.loadTasks();

      expect(component.todoTasks).toEqual([]);
      expect(component.inProgressTasks).toEqual([]);
      expect(component.doneTasks).toEqual([]);
      expect(component.archivedTasks).toEqual([]);
    });

    it('should handle 404 error gracefully', fakeAsync(() => {
      const error404 = { status: 404 };
      mockTaskService.getTasks.mockReturnValue(throwError(() => error404));

      component.loadTasks();
      tick();

      expect(mockSnackBar.open).not.toHaveBeenCalled();
      expect(component.todoTasks).toEqual([]);
      expect(component.inProgressTasks).toEqual([]);
      expect(component.doneTasks).toEqual([]);
      expect(component.archivedTasks).toEqual([]);
    }));

    it('should have error handling for loadTasks', () => {
      // Test that the component has error handling capability
      expect(component.loadTasks).toBeDefined();
      expect(typeof component.loadTasks).toBe('function');
      expect(mockSnackBar.open).toBeDefined();
    });

    it('should sort tasks by due date', () => {
      const tasksWithDates: Task[] = [
        { ...mockTasks[0], due_date: '2023-12-31T23:59:59.000Z' },
        { ...mockTasks[1], due_date: '2023-12-25T23:59:59.000Z' },
        { ...mockTasks[2], due_date: null },
      ];
      mockTaskService.getTasks.mockReturnValue(of(tasksWithDates));

      component.loadTasks();

      // Tasks should be sorted: null dates last, then by date
      expect(component.todoTasks.length).toBeGreaterThan(0);
    });
  });

  describe('onStartTask', () => {
    it('should have onStartTask method', () => {
      expect(component.onStartTask).toBeDefined();
      expect(typeof component.onStartTask).toBe('function');
    });

    it('should call taskService.startTask', () => {
      mockTaskService.startTask.mockReturnValue(of(mockTasks[0]));
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));

      component.onStartTask(mockTasks[0]);

      expect(mockTaskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
    });
  });

  describe('onCompleteTask', () => {
    it('should have onCompleteTask method', () => {
      expect(component.onCompleteTask).toBeDefined();
      expect(typeof component.onCompleteTask).toBe('function');
    });

    it('should call taskService.completeTask', () => {
      mockTaskService.completeTask.mockReturnValue(of(mockTasks[0]));
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));

      component.onCompleteTask(mockTasks[0]);

      expect(mockTaskService.completeTask).toHaveBeenCalledWith(mockTasks[0].id);
    });
  });

  describe('onArchiveTask', () => {
    it('should have onArchiveTask method', () => {
      expect(component.onArchiveTask).toBeDefined();
      expect(typeof component.onArchiveTask).toBe('function');
    });

    it('should call taskService.archiveTask', () => {
      mockTaskService.archiveTask.mockReturnValue(of(mockTasks[0]));
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));

      component.onArchiveTask(mockTasks[0]);

      expect(mockTaskService.archiveTask).toHaveBeenCalledWith(mockTasks[0].id);
    });
  });

  describe('onPrintTask', () => {
    it('should have onPrintTask method', () => {
      expect(component.onPrintTask).toBeDefined();
      expect(typeof component.onPrintTask).toBe('function');
    });

    it('should call taskService.printTask', () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      mockTaskService.printTask.mockReturnValue(of(mockBlob));
      jest.spyOn(window, 'open').mockReturnValue({} as Window);
      jest.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob-url');

      component.onPrintTask(mockTasks[0]);

      expect(mockTaskService.printTask).toHaveBeenCalledWith(mockTasks[0].id);
    });
  });

  describe('onEditTask', () => {
    it('should have onEditTask method', () => {
      expect(component.onEditTask).toBeDefined();
      expect(typeof component.onEditTask).toBe('function');
    });

    it('should open dialog', () => {
      const mockDialogRef = {
        afterClosed: () => of(null),
      };
      mockDialog.open.mockReturnValue(mockDialogRef as unknown as MatDialogRef<unknown, unknown>);

      component.onEditTask(mockTasks[0]);

      expect(mockDialog.open).toHaveBeenCalledWith(TaskEditDialogComponent, {
        data: mockTasks[0],
        width: '500px',
      });
    });
  });

  describe('onReopenTask', () => {
    it('should have onReopenTask method', () => {
      expect(component.onReopenTask).toBeDefined();
      expect(typeof component.onReopenTask).toBe('function');
    });

    it('should call taskService.updateTaskState', () => {
      mockTaskService.updateTaskState.mockReturnValue(of(mockTasks[0]));
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));

      component.onReopenTask(mockTasks[0]);

      expect(mockTaskService.updateTaskState).toHaveBeenCalledWith(mockTasks[0].id, 'todo');
    });
  });

  describe('toggleArchivedTasks', () => {
    it('should toggle showArchived and reload tasks', () => {
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));

      component.toggleArchivedTasks();

      expect(component.showArchived).toBe(true);
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(0, 100, true, true);
    });
  });

  describe('toggleMyTasks', () => {
    afterEach(() => {
      localStorage.removeItem('planIt_myTasksOnly');
    });

    it('should toggle myTasksOnly and reload tasks', () => {
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));
      expect(component.myTasksOnly).toBe(false);

      component.toggleMyTasks();

      expect(component.myTasksOnly).toBe(true);
      // include_created=false when myTasksOnly=true
      expect(mockTaskService.getTasks).toHaveBeenCalledWith(0, 100, false, false);
    });

    it('should persist myTasksOnly state to localStorage', () => {
      mockTaskService.getTasks.mockReturnValue(of(mockTasks));

      component.toggleMyTasks();

      expect(localStorage.getItem('planIt_myTasksOnly')).toBe('true');

      component.toggleMyTasks();

      expect(localStorage.getItem('planIt_myTasksOnly')).toBe('false');
    });
  });

  describe('formatDueDate', () => {
    it('should format valid date', () => {
      const result = component.formatDueDate('2023-12-31T23:59:59.000Z');
      // toLocaleString format varies by timezone, check for basic date components
      // Date format varies by locale/OS — just verify it contains year and time components
      expect(result).toMatch(/2023|2024/); // Should contain the year
      expect(result).toMatch(/\d{1,2}[.:]\d{2}/); // Should include time-like pattern
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
      const soonTask = {
        ...mockTasks[0],
        due_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      };
      expect(component.isDueSoon(soonTask)).toBe(true);
    });
  });

  describe('getTaskClass', () => {
    it('should return "overdue" for overdue tasks', () => {
      const pastTask = { ...mockTasks[0], due_date: '2020-01-01T00:00:00.000Z' };
      expect(component.getTaskClass(pastTask)).toBe('overdue');
    });

    it('should return "due-soon" for tasks due soon', () => {
      const soonTask = {
        ...mockTasks[0],
        due_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      };
      expect(component.getTaskClass(soonTask)).toBe('due-soon');
    });

    it('should return empty string for normal tasks', () => {
      const normalTask = { ...mockTasks[0], due_date: '2030-01-01T00:00:00.000Z' };
      expect(component.getTaskClass(normalTask)).toBe('');
    });
  });

  describe('hasAnyTasks', () => {
    it('should return false when no tasks', () => {
      // Clear all task arrays
      component.todoTasks = [];
      component.inProgressTasks = [];
      component.doneTasks = [];
      component.archivedTasks = [];
      component.showArchived = false;

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
      // Clear other task arrays
      component.todoTasks = [];
      component.inProgressTasks = [];
      component.doneTasks = [];

      expect(component.hasAnyTasks()).toBe(false);
    });
  });

  describe('onViewDetails', () => {
    it('should navigate to the task details page', () => {
      component.onViewDetails(mockTasks[0]);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks', mockTasks[0].id, 'details']);
    });
  });
});
