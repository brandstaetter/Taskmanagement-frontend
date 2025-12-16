import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { UserProfileComponent } from './user-profile.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['updatePassword', 'updateAvatar']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent, ReactiveFormsModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    authService.getCurrentUser.and.returnValue({
      id: 1,
      email: 'test@example.com',
      is_active: true,
      is_admin: false,
      is_superadmin: false,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user profile on init', () => {
    expect(component.user).toBeDefined();
    expect(component.user?.email).toBe('test@example.com');
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should update password successfully', () => {
    userService.updatePassword.and.returnValue(of(undefined));

    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });

    component.updatePassword();

    expect(userService.updatePassword).toHaveBeenCalledWith({
      current_password: 'oldpass123',
      new_password: 'newpass123',
    });
  });

  it('should not update password if passwords do not match', () => {
    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'different123',
    });

    component.updatePassword();

    expect(userService.updatePassword).not.toHaveBeenCalled();
  });

  it('should update avatar successfully', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      is_active: true,
      is_admin: false,
      is_superadmin: false,
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };
    userService.updateAvatar.and.returnValue(of(mockUser));

    component.avatarForm.patchValue({
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    component.updateAvatar();

    expect(userService.updateAvatar).toHaveBeenCalledWith({
      avatar_url: 'https://example.com/avatar.jpg',
    });
  });

  it('should hide password and avatar tabs when user is superadmin', () => {
    authService.getCurrentUser.and.returnValue({
      id: 1,
      email: 'test@example.com',
      is_active: true,
      is_admin: true,
      is_superadmin: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    });

    component.loadUserProfile();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-tab-group')).toBeNull();
  });
});
