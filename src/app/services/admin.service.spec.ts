import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a user', () => {
    const userCreate = {
      email: 'newuser@example.com',
      password: 'password123',
      is_admin: false,
    };
    const mockUser = {
      id: 1,
      email: 'newuser@example.com',
      is_active: true,
      is_admin: false,
      is_superadmin: false,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    service.createUser(userCreate).subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne(`${apiUrl}/admin/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(userCreate);
    req.flush(mockUser);
  });

  it('should reset user password', () => {
    const userId = 1;
    const passwordReset = { new_password: 'newpassword123' };

    service.resetUserPassword(userId, passwordReset).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(`${apiUrl}/admin/users/${userId}/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(passwordReset);
    req.flush(null);
  });

  it('should initialize database', () => {
    const mockResponse = { message: 'Database initialized successfully' };

    service.initDatabase().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/admin/db/init`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should migrate database', () => {
    const mockResponse = { message: 'Database migrated successfully' };

    service.migrateDatabase().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/admin/db/migrate`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
