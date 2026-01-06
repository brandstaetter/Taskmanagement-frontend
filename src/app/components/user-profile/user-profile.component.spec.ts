import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { UserProfileComponent } from './user-profile.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';

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

  it('should load avatar URL when user has avatar', () => {
    authService.getCurrentUser.and.returnValue({
      id: 1,
      email: 'test@example.com',
      is_active: true,
      is_admin: false,
      is_superadmin: false,
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    });

    component.loadUserProfile();
    fixture.detectChanges();

    expect(component.avatarForm.get('avatarUrl')?.value).toBe('https://example.com/avatar.jpg');
  });

  it('should not update password when form is invalid', () => {
    component.passwordForm.patchValue({
      currentPassword: 'short', // too short - violates minLength
      newPassword: 'short',
      confirmPassword: 'short',
    });

    component.updatePassword();

    expect(userService.updatePassword).not.toHaveBeenCalled();
    expect(component.passwordForm.controls.currentPassword.touched).toBeTrue();
    expect(component.passwordForm.controls.newPassword.touched).toBeTrue();
    expect(component.passwordForm.controls.confirmPassword.touched).toBeTrue();
  });

  it('should not update password when already loading', () => {
    component.isLoadingPassword = true;
    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });

    component.updatePassword();

    expect(userService.updatePassword).not.toHaveBeenCalled();
  });

  it('should handle password update error with detail message', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    userService.updatePassword.and.returnValue(
      throwError(() => {
        const error = new Error('Update failed');
        (error as { error?: { detail?: string } }).error = { detail: 'Custom error message' };
        return error;
      })
    );

    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });

    component.updatePassword();

    expect(snackBarSpy).toHaveBeenCalledWith('Custom error message', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingPassword).toBeFalse();
  });

  it('should handle password update error without detail message', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    userService.updatePassword.and.returnValue(throwError(() => new Error('Update failed')));

    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });

    component.updatePassword();

    expect(snackBarSpy).toHaveBeenCalledWith(
      'Failed to update password. Please check your current password and try again.',
      'Close',
      {
        duration: 5000,
        panelClass: ['error-snackbar'],
      }
    );
    expect(component.isLoadingPassword).toBeFalse();
  });

  it('should not update avatar when form is invalid', () => {
    component.avatarForm.patchValue({
      avatarUrl: '', // empty - violates required
    });

    component.updateAvatar();

    expect(userService.updateAvatar).not.toHaveBeenCalled();
    expect(component.avatarForm.controls.avatarUrl.touched).toBeTrue();
  });

  it('should not update avatar when already loading', () => {
    component.isLoadingAvatar = true;
    component.avatarForm.patchValue({
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    component.updateAvatar();

    expect(userService.updateAvatar).not.toHaveBeenCalled();
  });

  it('should handle avatar update error with detail message', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    userService.updateAvatar.and.returnValue(
      throwError(() => {
        const error = new Error('Update failed');
        (error as { error?: { detail?: string } }).error = { detail: 'Avatar upload failed' };
        return error;
      })
    );

    component.avatarForm.patchValue({
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    component.updateAvatar();

    expect(snackBarSpy).toHaveBeenCalledWith('Avatar upload failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingAvatar).toBeFalse();
  });

  it('should handle avatar update error without detail message', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    userService.updateAvatar.and.returnValue(throwError(() => new Error('Update failed')));

    component.avatarForm.patchValue({
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    component.updateAvatar();

    expect(snackBarSpy).toHaveBeenCalledWith('Failed to update avatar', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingAvatar).toBeFalse();
  });

  it('should show success message when password is updated successfully', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    userService.updatePassword.and.returnValue(of(undefined));

    component.passwordForm.patchValue({
      currentPassword: 'oldpass123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });

    component.updatePassword();

    expect(snackBarSpy).toHaveBeenCalledWith('Password updated successfully', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
    expect(component.passwordForm.pristine).toBeTrue();
    expect(component.isLoadingPassword).toBeFalse();
  });

  it('should show success message and update user when avatar is updated successfully', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    const mockUpdatedUser = {
      id: 1,
      email: 'test@example.com',
      is_active: true,
      is_admin: false,
      is_superadmin: false,
      avatar_url: 'https://example.com/new-avatar.jpg',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };
    userService.updateAvatar.and.returnValue(of(mockUpdatedUser));

    component.avatarForm.patchValue({
      avatarUrl: 'https://example.com/new-avatar.jpg',
    });

    component.updateAvatar();

    expect(snackBarSpy).toHaveBeenCalledWith('Avatar updated successfully', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
    expect(component.user).toBe(mockUpdatedUser);
    expect(component.isLoadingAvatar).toBeFalse();
  });
});
