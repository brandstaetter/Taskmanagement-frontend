import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService, Task, TaskCreate } from './task.service';
import { environment } from '../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should get tasks with default parameters', () => {
      const mockTasks: Task[] = [
        { id: 1, title: 'Task 1', description: 'Description 1', state: 'todo' },
      ];

      service.getTasks().subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks?skip=0&limit=100&include_archived=false`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should get tasks with pagination and archive filter', (done: DoneFn) => {
      const mockResponse: Task[] = [
        { id: 1, title: 'Task 1', description: 'Description 1', state: 'done' },
        { id: 2, title: 'Task 2', description: 'Description 2', state: 'archived' },
      ];

      service.getTasks(10, 50, true).subscribe(tasks => {
        expect(tasks).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks?skip=10&limit=50&include_archived=true`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const newTask: TaskCreate = {
        title: 'New Task',
        description: 'New Description',
      };

      const mockResponse: Task = {
        id: 1,
        title: 'New Task',
        description: 'New Description',
        state: 'todo',
      };

      service.createTask(newTask).subscribe(task => {
        expect(task).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTask);
      req.flush(mockResponse);
    });
  });

  describe('printTask', () => {
    it('should handle PDF response', () => {
      const taskId = 1;
      const mockPdfBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      service.printTask(taskId).subscribe(response => {
        expect(response instanceof Blob).toBe(true);
        expect((response as Blob).type).toBe('application/pdf');
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks/${taskId}/print`);
      expect(req.request.method).toBe('POST');
      req.flush(mockPdfBlob, {
        headers: { 'content-type': 'application/pdf' },
      });
    });

    it('should handle JSON response', () => {
      const taskId = 1;
      const mockJsonResponse = { message: 'Success' };
      const mockJsonBlob = new Blob([JSON.stringify(mockJsonResponse)], {
        type: 'application/json',
      });

      service.printTask(taskId).subscribe(response => {
        expect(response).toEqual(mockJsonResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks/${taskId}/print`);
      expect(req.request.method).toBe('POST');
      req.flush(mockJsonBlob, {
        headers: { 'content-type': 'application/json' },
      });
    });
  });

  describe('task state changes', () => {
    const taskId = 1;
    const mockTask: Task = {
      id: 1,
      title: 'Task',
      description: 'Description',
      state: 'todo',
    };

    it('should start a task', () => {
      service.startTask(taskId).subscribe(task => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks/${taskId}/start`);
      expect(req.request.method).toBe('POST');
      req.flush(mockTask);
    });

    it('should complete a task', () => {
      service.completeTask(taskId).subscribe(task => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks/${taskId}/complete`);
      expect(req.request.method).toBe('POST');
      req.flush(mockTask);
    });

    it('should archive a task', () => {
      service.archiveTask(taskId).subscribe(task => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`${apiUrl}/tasks/${taskId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockTask);
    });
  });

  describe('authentication', () => {
    it('should handle login', () => {
      const mockResponse = {
        access_token: 'token123',
        token_type: 'bearer',
      };

      service.login('username', 'password').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });
  });
});
