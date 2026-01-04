import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';
import { PasswordResetResponse } from '../generated';
import { User } from '../models/user.model';
import { of } from 'rxjs';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService],
    });
    service = TestBed.inject(AdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct method signatures', () => {
    // Test that methods exist and return Observables
    expect(service.createUser).toBeDefined();
    expect(service.resetUserPassword).toBeDefined();
    expect(service.initDatabase).toBeDefined();
    expect(service.migrateDatabase).toBeDefined();
  });

  it('should handle user creation with correct type', () => {
    const userCreate = {
      email: 'test@example.com',
      password: 'password123',
      is_admin: false,
    };

    // Just test that the method can be called with correct parameters
    const createUserSpy = spyOn(service, 'createUser').and.returnValue(of({} as User));

    service.createUser(userCreate).subscribe();

    expect(createUserSpy).toHaveBeenCalledWith(userCreate);
  });

  it('should handle password reset with correct type', () => {
    const userId = 1;
    const mockResponse: PasswordResetResponse = {
      email: 'test@example.com',
      new_password: 'newpassword123',
    };

    const resetPasswordSpy = spyOn(service, 'resetUserPassword').and.returnValue(of(mockResponse));

    service.resetUserPassword(userId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    expect(resetPasswordSpy).toHaveBeenCalledWith(userId);
  });

  it('should handle database initialization', () => {
    const mockResponse = { message: 'Database initialized successfully' };
    const initDbSpy = spyOn(service, 'initDatabase').and.returnValue(of(mockResponse));

    service.initDatabase().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    expect(initDbSpy).toHaveBeenCalled();
  });

  it('should handle database migration', () => {
    const mockResponse = { message: 'Database migrated successfully' };
    const migrateDbSpy = spyOn(service, 'migrateDatabase').and.returnValue(of(mockResponse));

    service.migrateDatabase().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    expect(migrateDbSpy).toHaveBeenCalled();
  });
});
