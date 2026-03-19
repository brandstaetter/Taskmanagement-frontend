import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminService } from '../../services/admin.service';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';
import { User, PasswordResetResponse } from '../../generated';
import { of, throwError } from 'rxjs';

/** Returns a fake MatDialogRef whose afterClosed() emits `result`. */
function fakeDialogRef(result: boolean | undefined): MatDialogRef<unknown, unknown> {
  return { afterClosed: () => of(result) } as unknown as MatDialogRef<unknown, unknown>;
}

const mockUser: User = {
  id: 1,
  email: 'user@example.com',
  is_active: true,
  is_admin: false,
  is_superadmin: false,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
};

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let adminService: jasmine.SpyObj<AdminService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const adminServiceSpy = jasmine.createSpyObj('AdminService', [
      'createUser',
      'listUsers',
      'deleteUser',
      'resetUserPassword',
      'updateUserRole',
      'initDatabase',
      'migrateDatabase',
    ]);
    adminServiceSpy.listUsers.and.returnValue(of([mockUser]));

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

  it('should load users on init', () => {
    expect(adminService.listUsers).toHaveBeenCalled();
    expect(component.users).toEqual([mockUser]);
  });

  it('should handle load users error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    adminService.listUsers.and.returnValue(
      throwError(() => ({ error: { detail: 'Load failed' } }))
    );
    component.loadUsers();
    expect(snackBarSpy).toHaveBeenCalledWith('Load failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isLoadingUsers).toBe(false);
  });

  it('should create a user successfully and refresh list', () => {
    adminService.createUser.and.returnValue(of(mockUser));

    component.createUserForm.patchValue({
      email: 'newuser@example.com',
      password: 'Test1234!',
      isAdmin: false,
    });

    component.createUser();

    expect(adminService.createUser).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'Test1234!',
      is_admin: false,
    });
    expect(adminService.listUsers).toHaveBeenCalledTimes(2);
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

  it('should handle create user error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    adminService.createUser.and.returnValue(
      throwError(() => ({ error: { detail: 'User creation failed' } }))
    );

    component.createUserForm.patchValue({
      email: 'test@example.com',
      password: 'Test1234!',
      isAdmin: false,
    });

    component.createUser();

    expect(snackBarSpy).toHaveBeenCalledWith('User creation failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isCreatingUser).toBe(false);
  });

  it('should delete user after confirmation', () => {
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(true));
    adminService.deleteUser.and.returnValue(of(mockUser));

    component.deleteUser(1);

    expect(adminService.deleteUser).toHaveBeenCalledWith(1);
    expect(adminService.listUsers).toHaveBeenCalledTimes(2);
  });

  it('should not delete user without confirmation', () => {
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(false));

    component.deleteUser(1);

    expect(adminService.deleteUser).not.toHaveBeenCalled();
  });

  it('should handle delete user error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(true));
    adminService.deleteUser.and.returnValue(
      throwError(() => ({ error: { detail: 'Delete failed' } }))
    );

    component.deleteUser(1);

    expect(snackBarSpy).toHaveBeenCalledWith('Delete failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  });

  it('should reset user password and open dialog', () => {
    const mockResponse: PasswordResetResponse = {
      email: 'test@example.com',
      new_password: 'newTest1234!',
    };
    const dialogOpenSpy = spyOn(component['dialog'], 'open').and.returnValue(
      fakeDialogRef(undefined)
    );
    adminService.resetUserPassword.and.returnValue(of(mockResponse));

    component.resetPassword(1);

    expect(adminService.resetUserPassword).toHaveBeenCalledWith(1);
    expect(dialogOpenSpy).toHaveBeenCalledWith(PasswordResetDialogComponent, {
      data: { email: 'test@example.com', newPassword: 'newTest1234!' },
      width: '420px',
      disableClose: true,
    });
  });

  it('should not reset password when already resetting for that user', () => {
    adminService.resetUserPassword.and.returnValue(of({ email: 'x@x.com', new_password: 'p' }));
    component.resettingPasswordIds.add(1);

    component.resetPassword(1);

    expect(adminService.resetUserPassword).not.toHaveBeenCalled();
  });

  it('should remove userId from resettingPasswordIds on success', () => {
    const mockResponse: PasswordResetResponse = {
      email: 'test@example.com',
      new_password: 'newTest1234!',
    };
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(undefined));
    adminService.resetUserPassword.and.returnValue(of(mockResponse));

    component.resetPassword(1);

    expect(component.resettingPasswordIds.has(1)).toBe(false);
  });

  it('should handle reset password error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    adminService.resetUserPassword.and.returnValue(
      throwError(() => ({ error: { detail: 'Password reset failed' } }))
    );

    component.resetPassword(1);

    expect(snackBarSpy).toHaveBeenCalledWith('Password reset failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.resettingPasswordIds.has(1)).toBe(false);
  });

  it('should toggle admin role', () => {
    const adminUser = { ...mockUser, is_admin: false };
    adminService.updateUserRole.and.returnValue(of({ ...mockUser, is_admin: true }));

    component.toggleRole(adminUser);

    expect(adminService.updateUserRole).toHaveBeenCalledWith(1, true);
    expect(adminService.listUsers).toHaveBeenCalledTimes(2);
  });

  it('should handle toggle role error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    adminService.updateUserRole.and.returnValue(
      throwError(() => ({ error: { detail: 'Role update failed' } }))
    );

    component.toggleRole(mockUser);

    expect(snackBarSpy).toHaveBeenCalledWith('Role update failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  });

  it('should initialize database with confirmation', () => {
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(true));
    adminService.initDatabase.and.returnValue(of({ message: 'Database initialized successfully' }));

    component.initializeDatabase();

    expect(adminService.initDatabase).toHaveBeenCalled();
  });

  it('should not initialize database without confirmation', () => {
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(false));

    component.initializeDatabase();

    expect(adminService.initDatabase).not.toHaveBeenCalled();
  });

  it('should not initialize database when already initializing', () => {
    component.isInitializingDb = true;
    const dialogSpy = spyOn(component['dialog'], 'open');

    component.initializeDatabase();

    expect(dialogSpy).not.toHaveBeenCalled();
    expect(adminService.initDatabase).not.toHaveBeenCalled();
  });

  it('should migrate database with confirmation', () => {
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(true));
    adminService.migrateDatabase.and.returnValue(of({ message: 'Database migrated successfully' }));

    component.migrateDatabase();

    expect(adminService.migrateDatabase).toHaveBeenCalled();
  });

  it('should not migrate database without confirmation', () => {
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(false));

    component.migrateDatabase();

    expect(adminService.migrateDatabase).not.toHaveBeenCalled();
  });

  it('should not migrate database when already migrating', () => {
    component.isMigratingDb = true;
    const dialogSpy = spyOn(component['dialog'], 'open');

    component.migrateDatabase();

    expect(dialogSpy).not.toHaveBeenCalled();
    expect(adminService.migrateDatabase).not.toHaveBeenCalled();
  });

  it('should handle initialize database error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(true));
    adminService.initDatabase.and.returnValue(
      throwError(() => ({ error: { detail: 'Database init failed' } }))
    );

    component.initializeDatabase();

    expect(snackBarSpy).toHaveBeenCalledWith('Database init failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isInitializingDb).toBe(false);
  });

  it('should handle migrate database error', () => {
    const snackBarSpy = spyOn(component['snackBar'], 'open');
    spyOn(component['dialog'], 'open').and.returnValue(fakeDialogRef(true));
    adminService.migrateDatabase.and.returnValue(
      throwError(() => ({ error: { detail: 'Database migration failed' } }))
    );

    component.migrateDatabase();

    expect(snackBarSpy).toHaveBeenCalledWith('Database migration failed', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
    expect(component.isMigratingDb).toBe(false);
  });

  describe('passwordStrengthValidator', () => {
    it('should return null for a valid password', () => {
      const control = { value: 'Test1234!' } as import('@angular/forms').AbstractControl;
      expect(component.passwordStrengthValidator(control)).toBeNull();
    });

    it('should return noUppercase error when missing uppercase', () => {
      const control = { value: 'test1234!' } as import('@angular/forms').AbstractControl;
      const errors = component.passwordStrengthValidator(control);
      expect(errors?.['noUppercase']).toBe(true);
    });

    it('should return noLowercase error when missing lowercase', () => {
      const control = { value: 'TEST1234!' } as import('@angular/forms').AbstractControl;
      const errors = component.passwordStrengthValidator(control);
      expect(errors?.['noLowercase']).toBe(true);
    });

    it('should return noDigit error when missing digit', () => {
      const control = { value: 'Testtest!' } as import('@angular/forms').AbstractControl;
      const errors = component.passwordStrengthValidator(control);
      expect(errors?.['noDigit']).toBe(true);
    });

    it('should return noSpecial error when missing special character', () => {
      const control = { value: 'Test1234a' } as import('@angular/forms').AbstractControl;
      const errors = component.passwordStrengthValidator(control);
      expect(errors?.['noSpecial']).toBe(true);
    });

    it('should return null for empty value', () => {
      const control = { value: '' } as import('@angular/forms').AbstractControl;
      expect(component.passwordStrengthValidator(control)).toBeNull();
    });
  });

  describe('getPasswordError', () => {
    it('should return required error first', () => {
      component.createUserForm.controls.password.setValue('');
      component.createUserForm.controls.password.markAsTouched();
      expect(component.getPasswordError()).toBe('Password is required');
    });

    it('should return minlength error for short password', () => {
      component.createUserForm.controls.password.setValue('Te1!');
      component.createUserForm.controls.password.markAsTouched();
      expect(component.getPasswordError()).toBe('Password must be at least 8 characters');
    });

    it('should return uppercase error', () => {
      component.createUserForm.controls.password.setValue('test1234!');
      component.createUserForm.controls.password.markAsTouched();
      expect(component.getPasswordError()).toBe('Must contain an uppercase letter');
    });

    it('should return empty string for valid password', () => {
      component.createUserForm.controls.password.setValue('Test1234!');
      component.createUserForm.controls.password.markAsTouched();
      expect(component.getPasswordError()).toBe('');
    });
  });
});
