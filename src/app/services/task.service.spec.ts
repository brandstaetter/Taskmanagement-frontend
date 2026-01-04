import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { Task, TaskCreate } from '../generated';
import { of } from 'rxjs';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService],
    });
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct method signatures', () => {
    expect(service.getTasks).toBeDefined();
    expect(service.getTask).toBeDefined();
    expect(service.getDueTasks).toBeDefined();
    expect(service.getRandomTask).toBeDefined();
    expect(service.searchTasks).toBeDefined();
    expect(service.createTask).toBeDefined();
    expect(service.startTask).toBeDefined();
    expect(service.printTask).toBeDefined();
    expect(service.completeTask).toBeDefined();
    expect(service.archiveTask).toBeDefined();
    expect(service.updateTaskState).toBeDefined();
    expect(service.updateTask).toBeDefined();
    expect(service.triggerMaintenance).toBeDefined();
  });

  it('should handle getTasks with correct parameters', () => {
    const getTasksSpy = spyOn(service, 'getTasks').and.returnValue(of([] as Task[]));

    service.getTasks(10, 50, true).subscribe();

    expect(getTasksSpy).toHaveBeenCalledWith(10, 50, true);
  });

  it('should handle createTask with correct type', () => {
    const taskCreate: TaskCreate = {
      title: 'Test Task',
      description: 'Test Description',
      created_by: 1,
    };

    const createTaskSpy = spyOn(service, 'createTask').and.returnValue(of({} as Task));

    service.createTask(taskCreate).subscribe();

    expect(createTaskSpy).toHaveBeenCalledWith(taskCreate);
  });

  it('should handle updateTaskState with valid states', () => {
    const updateTaskStateSpy = spyOn(service, 'updateTaskState').and.returnValue(of({} as Task));

    service.updateTaskState(1, 'todo').subscribe();
    expect(updateTaskStateSpy).toHaveBeenCalledWith(1, 'todo');

    service.updateTaskState(1, 'in_progress').subscribe();
    expect(updateTaskStateSpy).toHaveBeenCalledWith(1, 'in_progress');

    service.updateTaskState(1, 'done').subscribe();
    expect(updateTaskStateSpy).toHaveBeenCalledWith(1, 'done');

    service.updateTaskState(1, 'archived').subscribe();
    expect(updateTaskStateSpy).toHaveBeenCalledWith(1, 'archived');
  });
});
