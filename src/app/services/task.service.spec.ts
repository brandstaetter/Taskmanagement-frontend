import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { Task } from '../generated';
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

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getAccessToken']);
    mockAuthService.getAccessToken.and.returnValue('test-token');

    TestBed.configureTestingModule({
      providers: [
        TaskService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateTaskState', () => {
    it('should start task for in_progress state', () => {
      spyOn(service, 'startTask').and.returnValue(of(mockTask));

      service.updateTaskState(1, 'in_progress').subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(service.startTask).toHaveBeenCalledWith(1);
      });
    });

    it('should complete task for done state', () => {
      spyOn(service, 'completeTask').and.returnValue(of(mockTask));

      service.updateTaskState(1, 'done').subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(service.completeTask).toHaveBeenCalledWith(1);
      });
    });

    it('should archive task for archived state', () => {
      spyOn(service, 'archiveTask').and.returnValue(of(mockTask));

      service.updateTaskState(1, 'archived').subscribe(result => {
        expect(result).toEqual(mockTask);
        expect(service.archiveTask).toHaveBeenCalledWith(1);
      });
    });

    it('should handle unsupported state', () => {
      service.updateTaskState(1, 'invalid' as never).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBe('Unsupported state transition: invalid');
        },
      });
    });
  });
});
