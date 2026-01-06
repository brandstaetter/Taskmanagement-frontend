import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { AuthService } from './auth.service';

describe('TaskService', () => {
  let service: TaskService;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
        blob: () => Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
        text: () => Promise.resolve('{}'),
      } as Response)
    );

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
    it('should have getTasks method', () => {
      expect(service.getTasks).toBeDefined();
      expect(typeof service.getTasks).toBe('function');
    });

    it('should return Observable from getTasks', () => {
      const observable = service.getTasks();
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('getTask', () => {
    it('should have getTask method', () => {
      expect(service.getTask).toBeDefined();
      expect(typeof service.getTask).toBe('function');
    });
  });

  describe('getDueTasks', () => {
    it('should have getDueTasks method', () => {
      expect(service.getDueTasks).toBeDefined();
      expect(typeof service.getDueTasks).toBe('function');
    });
  });

  describe('getRandomTask', () => {
    it('should have getRandomTask method', () => {
      expect(service.getRandomTask).toBeDefined();
      expect(typeof service.getRandomTask).toBe('function');
    });
  });

  describe('searchTasks', () => {
    it('should have searchTasks method', () => {
      expect(service.searchTasks).toBeDefined();
      expect(typeof service.searchTasks).toBe('function');
    });
  });

  describe('createTask', () => {
    it('should have createTask method', () => {
      expect(service.createTask).toBeDefined();
      expect(typeof service.createTask).toBe('function');
    });
  });

  describe('startTask', () => {
    it('should have startTask method', () => {
      expect(service.startTask).toBeDefined();
      expect(typeof service.startTask).toBe('function');
    });
  });

  describe('completeTask', () => {
    it('should have completeTask method', () => {
      expect(service.completeTask).toBeDefined();
      expect(typeof service.completeTask).toBe('function');
    });
  });

  describe('archiveTask', () => {
    it('should have archiveTask method', () => {
      expect(service.archiveTask).toBeDefined();
      expect(typeof service.archiveTask).toBe('function');
    });
  });

  describe('printTask', () => {
    it('should have printTask method', () => {
      expect(service.printTask).toBeDefined();
      expect(typeof service.printTask).toBe('function');
    });
  });

  describe('updateTask', () => {
    it('should have updateTask method', () => {
      expect(service.updateTask).toBeDefined();
      expect(typeof service.updateTask).toBe('function');
    });
  });

  describe('triggerMaintenance', () => {
    it('should have triggerMaintenance method', () => {
      expect(service.triggerMaintenance).toBeDefined();
      expect(typeof service.triggerMaintenance).toBe('function');
    });
  });

  describe('updateTaskState', () => {
    it('should have updateTaskState method', () => {
      expect(service.updateTaskState).toBeDefined();
      expect(typeof service.updateTaskState).toBe('function');
    });
  });

  describe('Service Methods', () => {
    it('should have all required methods', () => {
      expect(service.getTasks).toBeDefined();
      expect(service.getTask).toBeDefined();
      expect(service.getDueTasks).toBeDefined();
      expect(service.getRandomTask).toBeDefined();
      expect(service.searchTasks).toBeDefined();
      expect(service.createTask).toBeDefined();
      expect(service.updateTask).toBeDefined();
      expect(service.startTask).toBeDefined();
      expect(service.completeTask).toBeDefined();
      expect(service.archiveTask).toBeDefined();
      expect(service.printTask).toBeDefined();
      expect(service.triggerMaintenance).toBeDefined();
      expect(service.updateTaskState).toBeDefined();
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
