import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainViewComponent } from './main-view.component';
import { AuthService } from '../../services/auth.service';
import { User } from '../../generated';

describe('MainViewComponent', () => {
  let component: MainViewComponent;
  let fixture: ComponentFixture<MainViewComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

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
    mockAuthService = jasmine.createSpyObj('AuthService', ['isAdmin', 'getCurrentUser', 'logout', 'getAccessToken']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MainViewComponent
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog }
      ]
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

  describe('openAddTaskDialog', () => {
    it('should have openAddTaskDialog method', () => {
      expect(component.openAddTaskDialog).toBeDefined();
      expect(typeof component.openAddTaskDialog).toBe('function');
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
});
