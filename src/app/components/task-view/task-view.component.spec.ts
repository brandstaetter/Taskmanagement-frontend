import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskViewComponent } from './task-view.component';
import { TaskService } from '../../services/task.service';
import { Task } from '../../services/task.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, EventEmitter, Input, Output } from '@angular/core';

// Mock TaskCardComponent
@Component({
  selector: 'app-task-card',
  template: '',
  standalone: true
})
class MockTaskCardComponent {
  @Input() task!: Task;
  @Input() mode = 'default';
  @Output() printTask = new EventEmitter<Task>();
}

describe('TaskViewComponent', () => {
  let component: TaskViewComponent;
  let fixture: ComponentFixture<TaskViewComponent>;
  let taskService: jasmine.SpyObj<TaskService>;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      state: 'todo',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // tomorrow
    },
    {
      id: 2,
      title: 'Task 2',
      description: 'Description 2',
      state: 'in_progress',
      due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // yesterday
    },
    {
      id: 3,
      title: 'Task 3',
      description: 'Description 3',
      state: 'archived',
      due_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
    }
  ];

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getDueTasks',
      'startTask',
      'completeTask',
      'archiveTask',
      'printTask'
    ]);
    taskServiceSpy.getDueTasks.and.returnValue(of(mockTasks));
    taskServiceSpy.startTask.and.returnValue(of({ ...mockTasks[0], state: 'in_progress' }));
    taskServiceSpy.completeTask.and.returnValue(of({ ...mockTasks[0], state: 'done' }));
    taskServiceSpy.archiveTask.and.returnValue(of({ ...mockTasks[0], state: 'archived' }));
    taskServiceSpy.printTask.and.returnValue(of(new Blob(['PDF content'], { type: 'application/pdf' })));

    await TestBed.configureTestingModule({
      imports: [
        TaskViewComponent,
        NoopAnimationsModule,
        MockTaskCardComponent
      ],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskViewComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load due tasks on init', () => {
    expect(taskService.getDueTasks).toHaveBeenCalled();
    expect(component.dueTasks.length).toBe(2); // excluding archived tasks by default
  });

  it('should toggle archived tasks visibility', () => {
    expect(component.dueTasks.length).toBe(2); // initially excluding archived
    
    component.toggleArchivedTasks();
    expect(component.showArchived).toBeTrue();
    expect(component.dueTasks.length).toBe(3); // now including archived
    
    component.toggleArchivedTasks();
    expect(component.showArchived).toBeFalse();
    expect(component.dueTasks.length).toBe(2); // back to excluding archived
  });

  it('should correctly identify overdue tasks', () => {
    expect(component.isOverdue(mockTasks[0])).toBeFalse(); // tomorrow
    expect(component.isOverdue(mockTasks[1])).toBeTrue(); // yesterday
  });

  it('should correctly identify tasks due soon', () => {
    expect(component.isDueSoon(mockTasks[0])).toBeFalse(); // tomorrow
    expect(component.isDueSoon(mockTasks[2])).toBeTrue(); // 2 hours from now
  });

  it('should start a task', fakeAsync(() => {
    component.onStartTask(mockTasks[0]);
    tick();
    
    expect(taskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after start
  }));

  it('should complete a task', fakeAsync(() => {
    component.onCompleteTask(mockTasks[0]);
    tick();
    
    expect(taskService.completeTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after complete
  }));

  it('should archive a task', fakeAsync(() => {
    component.onArchiveTask(mockTasks[0]);
    tick();
    
    expect(taskService.archiveTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(taskService.getDueTasks).toHaveBeenCalledTimes(2); // initial + after archive
  }));

  it('should print a task and create download link', fakeAsync(() => {
    // Mock URL.createObjectURL and document.createElement
    const mockUrl = 'blob:test';
    spyOn(window.URL, 'createObjectURL').and.returnValue(mockUrl);
    spyOn(window.URL, 'revokeObjectURL');
    const mockLink = document.createElement('a');
    spyOn(mockLink, 'click');
    spyOn(document, 'createElement').and.returnValue(mockLink);

    component.onPrintTask(mockTasks[0]);
    tick();

    expect(taskService.printTask).toHaveBeenCalledWith(mockTasks[0].id);
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLink.download).toBe(`task-${mockTasks[0].id}.pdf`);
    expect(mockLink.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);

    // Should start task if it was in todo state
    expect(taskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
  }));

  it('should handle non-PDF response when printing', fakeAsync(() => {
    // Mock console.log
    spyOn(console, 'log');
    
    // Change printTask to return a non-PDF response
    taskService.printTask.and.returnValue(of({ message: 'Sent to printer' }));

    component.onPrintTask(mockTasks[0]);
    tick();

    expect(console.log).toHaveBeenCalledWith('Task sent to printer');
    // Should still start task if it was in todo state
    expect(taskService.startTask).toHaveBeenCalledWith(mockTasks[0].id);
  }));
});
