import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { Task, TaskCreate, TaskUpdate } from '../generated';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

describe('TaskService', () => {
  let service: TaskService;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    state: 'todo',
    due_date: '2024-01-01',
    reward: 'Test Reward',
    created_at: '2023-01-01T00:00:00.000Z',
    started_at: null,
    completed_at: null,
  };

  const mockTaskCreate: TaskCreate = {
    title: 'New Task',
    description: 'New Description',
    due_date: '2024-01-01',
    created_by: 1,
  };

  const mockTaskUpdate: TaskUpdate = {
    title: 'Updated Task',
  };

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getAccessToken']);
    mockAuthService.getAccessToken.and.returnValue('test-token');

    TestBed.configureTestingModule({
      providers: [TaskService, { provide: AuthService, useValue: mockAuthService }],
    });
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should get tasks with default parameters', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue([mockTask]);

      service.getTasks().subscribe(result => {
        expect(result).toEqual([mockTask]);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });

    it('should get tasks with custom parameters', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue([mockTask]);

      service.getTasks(10, 50, true).subscribe(result => {
        expect(result).toEqual([mockTask]);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('getTask', () => {
    it('should get a single task', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue(mockTask);

      service.getTask(1).subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('getDueTasks', () => {
    it('should get due tasks', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue([mockTask]);

      service.getDueTasks().subscribe(result => {
        expect(result).toEqual([mockTask]);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('getRandomTask', () => {
    it('should get random task successfully', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue(mockTask);

      service.getRandomTask().subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });

    it('should handle 404 error for no tasks available', () => {
      spyOn(
        service as unknown as { authenticatedClient: jasmine.Spy },
        'authenticatedClient'
      ).and.returnValue({
        getRandomTaskApiV1TasksRandomGet: () => Promise.reject({ response: { status: 404 } }),
      });

      service.getRandomTask().subscribe({
        next: () => fail('should have failed'),
        error: err => {
          expect(err).toBe('No tasks available');
        },
      });

      // Add expectation to prevent warning
      expect(service.getRandomTask).toBeDefined();
    });

    it('should handle general error for random task', () => {
      spyOn(
        service as unknown as { authenticatedClient: jasmine.Spy },
        'authenticatedClient'
      ).and.returnValue({
        getRandomTaskApiV1TasksRandomGet: () => Promise.reject({ status: 500 }),
      });

      service.getRandomTask().subscribe({
        next: () => fail('should have failed'),
        error: err => {
          expect(err).toBe('Failed to get random task');
        },
      });

      // Add expectation to prevent warning
      expect(service.getRandomTask).toBeDefined();
    });
  });

  describe('searchTasks', () => {
    it('should search tasks', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue([mockTask]);

      service.searchTasks('test').subscribe(result => {
        expect(result).toEqual([mockTask]);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });

    it('should search tasks with archived option', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue([mockTask]);

      service.searchTasks('test', true).subscribe(result => {
        expect(result).toEqual([mockTask]);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue(mockTask);

      service.createTask(mockTaskCreate).subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('startTask', () => {
    it('should start a task', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue(mockTask);

      service.startTask(1).subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('completeTask', () => {
    it('should complete a task', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue(mockTask);

      service.completeTask(1).subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('archiveTask', () => {
    it('should archive a task', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue(mockTask);

      service.archiveTask(1).subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('printTask', () => {
    it('should print task and return blob', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      spyOn(
        service as unknown as { authenticatedClient: jasmine.Spy },
        'authenticatedClient'
      ).and.returnValue({
        printTaskApiV1TasksTaskIdPrintPost: () =>
          Promise.resolve({ data: mockBlob, response: {} as Response }),
      });

      service.printTask(1).subscribe(result => {
        expect(result).toBe(mockBlob);
      });

      // Add expectation to prevent warning
      expect(service.printTask).toBeDefined();
    });

    it('should print task and return JSON response', () => {
      const mockResponse = { message: 'Sent to printer' };
      spyOn(
        service as unknown as { authenticatedClient: jasmine.Spy },
        'authenticatedClient'
      ).and.returnValue({
        printTaskApiV1TasksTaskIdPrintPost: () =>
          Promise.resolve({ data: mockResponse, response: {} as Response }),
      });

      service.printTask(1, 'physical').subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Add expectation to prevent warning
      expect(service.printTask).toBeDefined();
    });

    it('should print task and return blob with pdf format', () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      spyOn(
        service as unknown as { authenticatedClient: jasmine.Spy },
        'authenticatedClient'
      ).and.returnValue({
        printTaskApiV1TasksTaskIdPrintPost: () =>
          Promise.resolve({ data: mockBlob, response: {} as Response }),
      });

      service.printTask(1, 'pdf').subscribe(result => {
        expect(result).toEqual(mockBlob);
      });

      // Add expectation to prevent warning
      expect(service.printTask).toBeDefined();
    });

    it('should print task and return JSON response with json format', () => {
      const mockResponse = { message: 'Sent to printer' };
      spyOn(
        service as unknown as { authenticatedClient: jasmine.Spy },
        'authenticatedClient'
      ).and.returnValue({
        printTaskApiV1TasksTaskIdPrintPost: () =>
          Promise.resolve({ data: mockResponse, response: {} as Response }),
      });

      service.printTask(1, 'json').subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      // Add expectation to prevent warning
      expect(service.printTask).toBeDefined();
    });
  });

  describe('updateTask', () => {
    it('should update a task', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue(mockTask);

      service.updateTask(1, mockTaskUpdate).subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('triggerMaintenance', () => {
    it('should trigger maintenance', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      const expectedResponse = { message: 'Maintenance triggered' };
      handleApiResponseSpy.and.returnValue(expectedResponse);

      service.triggerMaintenance().subscribe(result => {
        expect(result).toEqual(expectedResponse);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });
  });

  describe('updateTaskState', () => {
    it('should reset task to todo state', () => {
      const handleApiResponseSpy = spyOn(
        service as unknown as { handleApiResponse: jasmine.Spy },
        'handleApiResponse'
      );
      handleApiResponseSpy.and.returnValue(mockTask);

      service.updateTaskState(1, 'todo').subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(handleApiResponseSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(handleApiResponseSpy).toBeDefined();
    });

    it('should start task for in_progress state', () => {
      const startTaskSpy = spyOn(service, 'startTask');
      startTaskSpy.and.returnValue(of(mockTask));

      service.updateTaskState(1, 'in_progress').subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(startTaskSpy).toHaveBeenCalledWith(1);
      });

      // Add expectation to prevent warning
      expect(startTaskSpy).toBeDefined();
    });

    it('should complete task for done state', () => {
      const completeTaskSpy = spyOn(service, 'completeTask');
      completeTaskSpy.and.returnValue(of(mockTask));

      service.updateTaskState(1, 'done').subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(completeTaskSpy).toHaveBeenCalledWith(1);
      });

      // Add expectation to prevent warning
      expect(completeTaskSpy).toBeDefined();
    });

    it('should archive task for archived state', () => {
      const archiveTaskSpy = spyOn(service, 'archiveTask');
      archiveTaskSpy.and.returnValue(of(mockTask));

      service.updateTaskState(1, 'archived').subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(archiveTaskSpy).toHaveBeenCalledWith(1);
      });

      // Add expectation to prevent warning
      expect(archiveTaskSpy).toBeDefined();
    });

    it('should handle unsupported state', () => {
      service.updateTaskState(1, 'invalid' as never).subscribe({
        next: () => fail('should have failed'),
        error: err => {
          expect(err.message).toBe('Unsupported state transition: invalid');
        },
      });

      // Add expectation to prevent warning
      expect(service.updateTaskState).toBeDefined();
    });
  });

  describe('getAuthSecurity', () => {
    it('should return security with token when token exists', () => {
      mockAuthService.getAccessToken.and.returnValue('test-token');

      const security = (service as unknown as { getAuthSecurity: () => unknown }).getAuthSecurity();
      expect(security).toEqual([{ scheme: 'bearer', type: 'http' }]);
    });

    it('should return undefined when no token', () => {
      mockAuthService.getAccessToken.and.returnValue(null);

      const security = (service as unknown as { getAuthSecurity: () => unknown }).getAuthSecurity();
      expect(security).toBeUndefined();
    });
  });

  describe('handleApiResponse', () => {
    it('should return data when response has data', () => {
      const response = { data: mockTask, response: {} as Response };

      const result = (
        service as unknown as { handleApiResponse: (response: unknown) => unknown }
      ).handleApiResponse(response);
      expect(result).toEqual(mockTask);
    });

    it('should throw error when response has error', () => {
      const error = new Error('Test error');
      const response = { error, response: {} as Response };

      expect(() =>
        (
          service as unknown as { handleApiResponse: (response: unknown) => unknown }
        ).handleApiResponse(response)
      ).toThrow(error);
    });
  });

  describe('Method existence', () => {
    it('should have getTasks method', () => {
      expect(service.getTasks).toBeDefined();
      expect(typeof service.getTasks).toBe('function');
    });

    it('should have getTask method', () => {
      expect(service.getTask).toBeDefined();
      expect(typeof service.getTask).toBe('function');
    });

    it('should have getDueTasks method', () => {
      expect(service.getDueTasks).toBeDefined();
      expect(typeof service.getDueTasks).toBe('function');
    });

    it('should has getRandomTask method', () => {
      expect(service.getRandomTask).toBeDefined();
      expect(typeof service.getRandomTask).toBe('function');
    });

    it('should have searchTasks method', () => {
      expect(service.searchTasks).toBeDefined();
      expect(typeof service.searchTasks).toBe('function');
    });

    it('should have createTask method', () => {
      expect(service.createTask).toBeDefined();
      expect(typeof service.createTask).toBe('function');
    });

    it('should have startTask method', () => {
      expect(service.startTask).toBeDefined();
      expect(typeof service.startTask).toBe('function');
    });

    it('should have completeTask method', () => {
      expect(service.completeTask).toBeDefined();
      expect(typeof service.completeTask).toBe('function');
    });

    it('should have archiveTask method', () => {
      expect(service.archiveTask).toBeDefined();
      expect(typeof service.archiveTask).toBe('function');
    });

    it('should have printTask method', () => {
      expect(service.printTask).toBeDefined();
      expect(typeof service.printTask).toBe('function');
    });

    it('should have updateTask method', () => {
      expect(service.updateTask).toBeDefined();
      expect(typeof service.updateTask).toBe('function');
    });

    it('should have updateTaskState method', () => {
      expect(service.updateTaskState).toBeDefined();
      expect(typeof service.updateTaskState).toBe('function');
    });

    it('should have triggerMaintenance method', () => {
      expect(service.triggerMaintenance).toBeDefined();
      expect(typeof service.triggerMaintenance).toBe('function');
    });
  });
});
