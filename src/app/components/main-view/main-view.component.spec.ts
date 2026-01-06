import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MainViewComponent } from './main-view.component';
import { TaskViewComponent } from '../task-view/task-view.component';
import { PlanItComponent } from '../plan-it/plan-it.component';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { User } from '../../generated';
import { of } from 'rxjs';

describe('MainViewComponent', () => {
  let component: MainViewComponent;
  let fixture: ComponentFixture<MainViewComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    is_active: true,
    is_admin: false,
    is_superadmin: false,
    avatar_url: 'https://example.com/avatar.jpg',
    last_login: null,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'isAdmin',
      'getCurrentUser',
      'logout',
      'getAccessToken',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockTaskService = jasmine.createSpyObj('TaskService', ['getTasks', 'getDueTasks']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockTaskService.getTasks.and.returnValue(of([]));
    mockTaskService.getDueTasks.and.returnValue(of([]));

    // Simple mock that bypasses Angular Material's internal dialog logic
    const mockDialogRef = {
      afterClosed: () => of(null),
      close: () => {
        return;
      },
    } as MatDialogRef<unknown, unknown>;
    mockDialog.open.and.returnValue(mockDialogRef);

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, MainViewComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: TaskService, useValue: mockTaskService },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    })
      .overrideComponent(MainViewComponent, {
        set: {
          providers: [{ provide: MatDialog, useValue: mockDialog }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MainViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.currentView).toBe('do-it');
    expect(component.selectedIndex).toBe(0);
  });

  describe('isAdmin getter', () => {
    it('should return true when user is admin', () => {
      mockAuthService.isAdmin.and.returnValue(true);
      expect(component.isAdmin).toBe(true);
      expect(mockAuthService.isAdmin).toHaveBeenCalled();
    });

    it('should return false when user is not admin', () => {
      mockAuthService.isAdmin.and.returnValue(false);
      expect(component.isAdmin).toBe(false);
      expect(mockAuthService.isAdmin).toHaveBeenCalled();
    });
  });

  describe('currentUser getter', () => {
    it('should return current user from auth service', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      expect(component.currentUser).toBe(mockUser);
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should return null when no current user', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      expect(component.currentUser).toBeNull();
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    });
  });

  describe('onTabChange', () => {
    it('should switch to do-it view when index is 0', () => {
      component.onTabChange(0);

      expect(component.selectedIndex).toBe(0);
      expect(component.currentView).toBe('do-it');
    });

    it('should switch to plan-it view when index is 1', () => {
      component.onTabChange(1);

      expect(component.selectedIndex).toBe(1);
      expect(component.currentView).toBe('plan-it');
    });

    it('should handle tab changes without child components', () => {
      component.taskView = null!;
      component.planIt = null!;

      expect(() => {
        component.onTabChange(0);
        component.onTabChange(1);
      }).not.toThrow();
    });
  });

  describe('openProfile', () => {
    it('should navigate to profile', () => {
      component.openProfile();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/profile']);
    });
  });

  describe('openAdmin', () => {
    it('should navigate to admin', () => {
      component.openAdmin();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
    });
  });

  describe('logout', () => {
    it('should logout and navigate to login', () => {
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('openAddTaskDialog', () => {
    it('should open dialog and refresh do-it view when result is truthy', () => {
      const mockDialogRef = {
        afterClosed: () => of({ title: 'New Task' }),
      } as MatDialogRef<unknown, unknown>;
      mockDialog.open.and.returnValue(mockDialogRef);

      // Mock child component
      const mockTaskView = {
        loadDueTasks: jasmine.createSpy('loadDueTasks'),
      };
      component.taskView = mockTaskView as unknown as TaskViewComponent;
      component.currentView = 'do-it';

      component.openAddTaskDialog();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockTaskView.loadDueTasks).toHaveBeenCalled();
    });

    it('should open dialog and refresh plan-it view when result is truthy', () => {
      const mockDialogRef = {
        afterClosed: () => of({ title: 'New Task' }),
      } as MatDialogRef<unknown, unknown>;
      mockDialog.open.and.returnValue(mockDialogRef);

      // Mock child component
      const mockPlanIt = {
        loadTasks: jasmine.createSpy('loadTasks'),
      };
      component.planIt = mockPlanIt as unknown as PlanItComponent;
      component.currentView = 'plan-it';

      component.openAddTaskDialog();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockPlanIt.loadTasks).toHaveBeenCalled();
    });

    it('should not refresh when dialog result is falsy', () => {
      const mockDialogRef = {
        afterClosed: () => of(null),
      } as MatDialogRef<unknown, unknown>;
      mockDialog.open.and.returnValue(mockDialogRef);

      // Mock child components
      const mockTaskView = {
        loadDueTasks: jasmine.createSpy('loadDueTasks'),
      };
      const mockPlanIt = {
        loadTasks: jasmine.createSpy('loadTasks'),
      };
      component.taskView = mockTaskView as unknown as TaskViewComponent;
      component.planIt = mockPlanIt as unknown as PlanItComponent;

      component.currentView = 'do-it';
      component.openAddTaskDialog();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockTaskView.loadDueTasks).not.toHaveBeenCalled();
      expect(mockPlanIt.loadTasks).not.toHaveBeenCalled();
    });

    it('should handle missing child components gracefully', () => {
      const mockDialogRef = {
        afterClosed: () => of({ title: 'New Task' }),
      } as MatDialogRef<unknown, unknown>;
      mockDialog.open.and.returnValue(mockDialogRef);

      component.taskView = null!;
      component.planIt = null!;
      component.currentView = 'do-it';

      expect(() => {
        component.openAddTaskDialog();
      }).not.toThrow();

      expect(mockDialog.open).toHaveBeenCalled();
    });
  });
});
