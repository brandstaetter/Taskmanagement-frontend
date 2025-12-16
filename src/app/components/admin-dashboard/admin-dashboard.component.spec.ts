import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminService } from '../../services/admin.service';
import { of } from 'rxjs';

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
    adminService.resetUserPassword.and.returnValue(of(undefined));

    component.resetPasswordForm.patchValue({
      userId: '1',
      newPassword: 'newpassword123',
    });

    component.resetPassword();

    expect(adminService.resetUserPassword).toHaveBeenCalledWith(1, {
      new_password: 'newpassword123',
    });
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
});
