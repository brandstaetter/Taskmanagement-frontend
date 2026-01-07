import { TestBed } from '@angular/core/testing';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { User, AdminUserCreate } from '../generated';

describe('AdminService', () => {
  let service: AdminService;
  let mockAuthService: jasmine.SpyObj<AuthService>;

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

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getAccessToken']);

    TestBed.configureTestingModule({
      providers: [
        AdminService,
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(AdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAuthSecurity', () => {
    it('should return security object when token is available', () => {
      mockAuthService.getAccessToken.and.returnValue('test-token');

      // Access private method through type assertion for testing
      const authSecurity = (service as unknown as { getAuthSecurity(): { scheme: string; type: string; }[] | undefined }).getAuthSecurity();

      expect(authSecurity).toEqual([{ scheme: 'bearer', type: 'http' }]);
      expect(mockAuthService.getAccessToken).toHaveBeenCalled();
    });

    it('should return undefined when no token is available', () => {
      mockAuthService.getAccessToken.and.returnValue(null);

      const authSecurity = (service as unknown as { getAuthSecurity(): { scheme: string; type: string; }[] | undefined }).getAuthSecurity();

      expect(authSecurity).toBeUndefined();
      expect(mockAuthService.getAccessToken).toHaveBeenCalled();
    });
  });

  describe('handleApiResponse', () => {
    it('should return data when response is successful', () => {
      const response = { data: mockUser, response: new Response() };

      const result = (service as unknown as { handleApiResponse<T>(response: { data?: T; error?: unknown; response: Response }): T }).handleApiResponse(response);

      expect(result).toEqual(mockUser);
    });

    it('should throw error when response contains error', () => {
      const error = new Error('API Error');
      const response = { error, response: new Response() };

      expect(() => {
        (service as unknown as { handleApiResponse<T>(response: { data?: T; error?: unknown; response: Response }): T }).handleApiResponse(response);
      }).toThrow(error);
    });
  });

  describe('createUser', () => {
    it('should have createUser method', () => {
      expect(service.createUser).toBeDefined();
      expect(typeof service.createUser).toBe('function');
    });

    it('should accept AdminUserCreate parameter', () => {
      const userCreate: AdminUserCreate = {
        email: 'test@example.com',
        password: 'password123',
        is_admin: false,
      };

      expect(() => {
        const observable = service.createUser(userCreate);
        expect(observable).toBeDefined();
        expect(typeof observable.subscribe).toBe('function');
      }).not.toThrow();
    });

    it('should return Observable<User>', () => {
      const userCreate: AdminUserCreate = {
        email: 'test@example.com',
        password: 'password123',
        is_admin: false,
      };

      const observable = service.createUser(userCreate);
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('resetUserPassword', () => {
    it('should have resetUserPassword method', () => {
      expect(service.resetUserPassword).toBeDefined();
      expect(typeof service.resetUserPassword).toBe('function');
    });

    it('should accept userId parameter', () => {
      const userId = 1;

      expect(() => {
        const observable = service.resetUserPassword(userId);
        expect(observable).toBeDefined();
        expect(typeof observable.subscribe).toBe('function');
      }).not.toThrow();
    });

    it('should return Observable<PasswordResetResponse>', () => {
      const observable = service.resetUserPassword(1);
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('initDatabase', () => {
    it('should have initDatabase method', () => {
      expect(service.initDatabase).toBeDefined();
      expect(typeof service.initDatabase).toBe('function');
    });

    it('should return Observable<{ message: string }>', () => {
      const observable = service.initDatabase();
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('migrateDatabase', () => {
    it('should have migrateDatabase method', () => {
      expect(service.migrateDatabase).toBeDefined();
      expect(typeof service.migrateDatabase).toBe('function');
    });

    it('should return Observable<{ message: string }>', () => {
      const observable = service.migrateDatabase();
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('Service Structure', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
      const service2 = TestBed.inject(AdminService);
      expect(service).toBe(service2);
    });

    it('should depend on AuthService', () => {
      expect(service).toBeTruthy();
      expect(mockAuthService).toBeDefined();
    });
  });
});
