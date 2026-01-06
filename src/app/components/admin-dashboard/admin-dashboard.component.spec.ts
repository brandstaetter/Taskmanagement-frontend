import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminService } from '../../services/admin.service';
import { PasswordResetResponse } from '../../generated';
import { of, throwError } from 'rxjs';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let adminService: jasmine.SpyObj<AdminService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const adminServiceSpy = jasmine.createSpyObj('AdminService', [
      'createUser',
      'resetUserPassword',
      'initDatabase',
      'migrateDatabase',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        AdminDashboardComponent,
        ReactiveFormsModule,
        MatSnackBarModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: AdminService, useValue: adminServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should create a user successfully', () => {
    const mockUser = {
      id: 1,
      email: 'newuser@example.com',
      is_active: true,
      is_admin: false,
      is_superadmin: false,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };
    adminService.createUser.and.returnValue(of(mockUser));

    component.createUserForm.patchValue({
      email: 'newuser@example.com',
      password: 'password123',
      isAdmin: false,
    });

    component.createUser();

    expect(adminService.createUser).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      is_admin: false,
    });
  });

  it('should reset user password successfully', () => {
    const mockResponse: PasswordResetResponse = {
      email: 'test@example.com',
      new_password: 'newpassword123',
    };
    adminService.resetUserPassword.and.returnValue(of(mockResponse));

    component.resetPasswordForm.patchValue({
      userId: '1',
      newPassword: 'newpassword123',
    });

    component.resetPassword();

    expect(adminService.resetUserPassword).toHaveBeenCalledWith(1);
  });

  it('should initialize database with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.initDatabase.and.returnValue(of({ message: 'Database initialized successfully' }));

    component.initializeDatabase();

    expect(window.confirm).toHaveBeenCalled();
    expect(adminService.initDatabase).toHaveBeenCalled();
  });

  it('should not initialize database without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.initializeDatabase();

    expect(window.confirm).toHaveBeenCalled();
    expect(adminService.initDatabase).not.toHaveBeenCalled();
  });

  it('should migrate database with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.migrateDatabase.and.returnValue(of({ message: 'Database migrated successfully' }));

    component.migrateDatabase();

    expect(window.confirm).toHaveBeenCalled();
    expect(adminService.migrateDatabase).toHaveBeenCalled();
  });

  it('should not migrate database without confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.migrateDatabase();

    expect(window.confirm).toHaveBeenCalled();
    expect(adminService.migrateDatabase).not.toHaveBeenCalled();
  });

  it('should not initialize database when already initializing', () => {
    component.isInitializingDb = true;
    spyOn(window, 'confirm');

    component.initializeDatabase();

    expect(window.confirm).not.toHaveBeenCalled();
    expect(adminService.initDatabase).not.toHaveBeenCalled();
  });

  it('should not migrate database when already migrating', () => {
    component.isMigratingDb = true;
    spyOn(window, 'confirm');

    component.migrateDatabase();

    expect(window.confirm).not.toHaveBeenCalled();
    expect(adminService.migrateDatabase).not.toHaveBeenCalled();
  });

  it('should handle create user error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    adminService.createUser.and.returnValue(
      throwError(() => ({ error: { detail: 'User creation failed' } }))
    );

    component.createUserForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      isAdmin: false,
    });

    component.createUser();

    expect(adminService.createUser).toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith('User creation failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isCreatingUser).toBe(false);
  });

  it('should handle create user error with generic message', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    adminService.createUser.and.returnValue(throwError(() => ({ error: {} })));

    component.createUserForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      isAdmin: false,
    });

    component.createUser();

    expect(snackBarSpy).toHaveBeenCalledWith('Failed to create user', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  });

  it('should handle reset password error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    adminService.resetUserPassword.and.returnValue(
      throwError(() => ({ error: { detail: 'Password reset failed' } }))
    );

    component.resetPasswordForm.patchValue({
      userId: '1',
      newPassword: 'newpassword123',
    });

    component.resetPassword();

    expect(adminService.resetUserPassword).toHaveBeenCalledWith(1);
    expect(snackBarSpy).toHaveBeenCalledWith('Password reset failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isResettingPassword).toBe(false);
  });

  it('should handle reset password error with generic message', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    adminService.resetUserPassword.and.returnValue(throwError(() => ({ error: {} })));

    component.resetPasswordForm.patchValue({
      userId: '1',
      newPassword: 'newpassword123',
    });

    component.resetPassword();

    expect(snackBarSpy).toHaveBeenCalledWith('Failed to reset password', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  });

  it('should handle initialize database error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.initDatabase.and.returnValue(
      throwError(() => ({ error: { detail: 'Database init failed' } }))
    );

    component.initializeDatabase();

    expect(adminService.initDatabase).toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith('Database init failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isInitializingDb).toBe(false);
  });

  it('should handle initialize database error with generic message', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.initDatabase.and.returnValue(throwError(() => ({ error: {} })));

    component.initializeDatabase();

    expect(snackBarSpy).toHaveBeenCalledWith('Failed to initialize database', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  });

  it('should handle migrate database error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.migrateDatabase.and.returnValue(
      throwError(() => ({ error: { detail: 'Database migration failed' } }))
    );

    component.migrateDatabase();

    expect(adminService.migrateDatabase).toHaveBeenCalled();
    expect(snackBarSpy).toHaveBeenCalledWith('Database migration failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isMigratingDb).toBe(false);
  });

  it('should handle migrate database error with generic message', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    spyOn(window, 'confirm').and.returnValue(true);
    adminService.migrateDatabase.and.returnValue(throwError(() => ({ error: {} })));

    component.migrateDatabase();

    expect(snackBarSpy).toHaveBeenCalledWith('Failed to migrate database', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  });

  it('should not create user when form is invalid', () => {
    const markAllAsTouchedSpy = spyOn(component.createUserForm, 'markAllAsTouched');

    component.createUser();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(adminService.createUser).not.toHaveBeenCalled();
  });

  it('should not create user when already creating', () => {
    component.isCreatingUser = true;
    const markAllAsTouchedSpy = spyOn(component.createUserForm, 'markAllAsTouched');

    component.createUser();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(adminService.createUser).not.toHaveBeenCalled();
  });

  it('should not reset password when form is invalid', () => {
    const markAllAsTouchedSpy = spyOn(component.resetPasswordForm, 'markAllAsTouched');

    component.resetPassword();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(adminService.resetUserPassword).not.toHaveBeenCalled();
  });

  it('should not reset password when already resetting', () => {
    component.isResettingPassword = true;
    const markAllAsTouchedSpy = spyOn(component.resetPasswordForm, 'markAllAsTouched');

    component.resetPassword();

    expect(markAllAsTouchedSpy).toHaveBeenCalled();
    expect(adminService.resetUserPassword).not.toHaveBeenCalled();
  });

  it('should handle reset password with clipboard support', () => {
    const mockResponse: PasswordResetResponse = {
      email: 'test@example.com',
      new_password: 'newpassword123',
    };
    const mockClipboard = {
      writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
      read: jasmine.createSpy('read'),
      readText: jasmine.createSpy('readText'),
      write: jasmine.createSpy('write'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent'),
    } as Clipboard;
    spyOn(window, 'confirm').and.returnValue(true);
    spyOnProperty(navigator, 'clipboard').and.returnValue(mockClipboard);
    adminService.resetUserPassword.and.returnValue(of(mockResponse));

    component.resetPasswordForm.patchValue({
      userId: '1',
      newPassword: 'newpassword123',
    });

    component.resetPassword();

    expect(mockClipboard.writeText).toHaveBeenCalledWith('newpassword123');
    expect(adminService.resetUserPassword).toHaveBeenCalledWith(1);
  });

  it('should handle reset password without clipboard support', () => {
    const mockResponse: PasswordResetResponse = {
      email: 'test@example.com',
      new_password: 'newpassword123',
    };
    spyOnProperty(navigator, 'clipboard').and.returnValue(undefined as unknown as Clipboard);
    adminService.resetUserPassword.and.returnValue(of(mockResponse));

    component.resetPasswordForm.patchValue({
      userId: '1',
      newPassword: 'newpassword123',
    });

    component.resetPassword();

    expect(adminService.resetUserPassword).toHaveBeenCalledWith(1);
  });

  it('should handle reset password with clipboard error', () => {
    const mockResponse: PasswordResetResponse = {
      email: 'test@example.com',
      new_password: 'newpassword123',
    };
    const mockClipboard = {
      writeText: jasmine.createSpy('writeText').and.returnValue(Promise.reject()),
      read: jasmine.createSpy('read'),
      readText: jasmine.createSpy('readText'),
      write: jasmine.createSpy('write'),
      addEventListener: jasmine.createSpy('addEventListener'),
      removeEventListener: jasmine.createSpy('removeEventListener'),
      dispatchEvent: jasmine.createSpy('dispatchEvent'),
    } as Clipboard;
    spyOnProperty(navigator, 'clipboard').and.returnValue(mockClipboard);
    adminService.resetUserPassword.and.returnValue(of(mockResponse));

    component.resetPasswordForm.patchValue({
      userId: '1',
      newPassword: 'newpassword123',
    });

    component.resetPassword();

    expect(mockClipboard.writeText).toHaveBeenCalledWith('newpassword123');
    expect(adminService.resetUserPassword).toHaveBeenCalledWith(1);
  });

  it('should handle reset password without new password in response', () => {
    const mockResponse = {
      email: 'test@example.com',
      new_password: undefined,
    } as unknown as PasswordResetResponse;
    adminService.resetUserPassword.and.returnValue(of(mockResponse));

    component.resetPasswordForm.patchValue({
      userId: '1',
      newPassword: 'newpassword123',
    });

    component.resetPassword();

    expect(adminService.resetUserPassword).toHaveBeenCalledWith(1);
  });
});
