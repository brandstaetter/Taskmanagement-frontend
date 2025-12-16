import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  function createJwtToken(payload: Record<string, unknown>): string {
    const header = 'e30';
    const payloadStr = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    return `${header}.${payloadStr}.sig`;
  }

  describe('User State and Storage', () => {
    it('should initialize current user from localStorage when user JSON exists', () => {
      const storedUser = {
        id: 123,
        email: 'stored@example.com',
        is_active: true,
        is_admin: true,
        is_superadmin: false,
        avatar_url: null,
        last_login: null,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };
      localStorage.setItem('taskman_user', JSON.stringify(storedUser));

      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http);

      expect(newService.getCurrentUser()).toEqual(storedUser);
      expect(newService.isAdmin()).toBe(true);
    });

    it('should handle invalid JSON stored for user gracefully', () => {
      localStorage.setItem('taskman_user', '{invalid json');

      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http);

      expect(newService.getCurrentUser()).toBeNull();
      expect(newService.isAdmin()).toBe(false);
    });

    it('should handle localStorage errors when reading stored user gracefully', () => {
      spyOn(localStorage, 'getItem').and.throwError('Storage error');

      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http);

      expect(newService.getCurrentUser()).toBeNull();
    });

    it('should return false for isAdmin when no user exists', () => {
      expect(service.isAdmin()).toBe(false);
    });

    describe('isSuperAdmin', () => {
      it('should return true for superadmin users', () => {
        const storedUser = {
          id: 123,
          email: 'superadmin@example.com',
          is_active: true,
          is_admin: true,
          is_superadmin: true,
          avatar_url: null,
          last_login: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        };
        localStorage.setItem('taskman_user', JSON.stringify(storedUser));

        const http = TestBed.inject(HttpClient);
        const newService = new AuthService(http);

        expect(newService.isSuperAdmin()).toBe(true);
      });

      it('should return false for admin users', () => {
        const storedUser = {
          id: 123,
          email: 'admin@example.com',
          is_active: true,
          is_admin: true,
          is_superadmin: false,
          avatar_url: null,
          last_login: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        };
        localStorage.setItem('taskman_user', JSON.stringify(storedUser));

        const http = TestBed.inject(HttpClient);
        const newService = new AuthService(http);

        expect(newService.isSuperAdmin()).toBe(false);
      });

      it('should return false for regular users', () => {
        const storedUser = {
          id: 123,
          email: 'user@example.com',
          is_active: true,
          is_admin: false,
          is_superadmin: false,
          avatar_url: null,
          last_login: null,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        };
        localStorage.setItem('taskman_user', JSON.stringify(storedUser));

        const http = TestBed.inject(HttpClient);
        const newService = new AuthService(http);

        expect(newService.isSuperAdmin()).toBe(false);
      });
    });
  });

  describe('Token Storage and Retrieval', () => {
    const testToken = 'test-token-123';

    describe('setAccessToken', () => {
      it('should store token in localStorage', () => {
        service.setAccessToken(testToken);
        expect(localStorage.getItem('taskman_access_token')).toBe(testToken);
      });

      it('should handle localStorage errors gracefully', () => {
        spyOn(localStorage, 'setItem').and.throwError('Storage error');
        spyOn(console, 'error');

        service.setAccessToken(testToken);

        expect(console.error).toHaveBeenCalledWith(
          'Failed to set access token in localStorage:',
          jasmine.any(Error)
        );
      });
    });

    describe('getAccessToken', () => {
      it('should retrieve token from localStorage', () => {
        localStorage.setItem('taskman_access_token', testToken);
        expect(service.getAccessToken()).toBe(testToken);
      });

      it('should return null when no token is stored', () => {
        expect(service.getAccessToken()).toBeNull();
      });

      it('should return null when localStorage throws an error', () => {
        spyOn(localStorage, 'getItem').and.throwError('Storage error');
        expect(service.getAccessToken()).toBeNull();
      });
    });

    describe('clearAccessToken', () => {
      it('should remove token from localStorage', () => {
        localStorage.setItem('taskman_access_token', testToken);
        service.clearAccessToken();
        expect(localStorage.getItem('taskman_access_token')).toBeNull();
      });

      it('should handle localStorage errors gracefully', () => {
        spyOn(localStorage, 'removeItem').and.throwError('Storage error');
        spyOn(console, 'error');

        service.clearAccessToken();

        expect(console.error).toHaveBeenCalledWith(
          'Failed to clear access token from localStorage:',
          jasmine.any(Error)
        );
      });
    });
  });

  describe('Authentication State Management', () => {
    describe('isAuthenticated', () => {
      it('should return true when token exists', () => {
        localStorage.setItem('taskman_access_token', 'test-token');
        expect(service.isAuthenticated()).toBe(true);
      });

      it('should return false when no token exists', () => {
        expect(service.isAuthenticated()).toBe(false);
      });

      it('should return false when token is empty string', () => {
        localStorage.setItem('taskman_access_token', '');
        expect(service.isAuthenticated()).toBe(false);
      });

      it('should return false when getAccessToken returns null', () => {
        spyOn(localStorage, 'getItem').and.throwError('Storage error');
        expect(service.isAuthenticated()).toBe(false);
      });
    });
  });

  describe('Login API Interaction', () => {
    it('should send login request with correct format', () => {
      const username = 'testuser';
      const password = 'testpass';
      const mockResponse: AuthResponse = {
        access_token: 'token-abc-123',
        token_type: 'bearer',
      };

      service.login(username, password).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      expect(req.request.body).toBe('username=testuser&password=testpass');
      req.flush(mockResponse);
    });

    it('should store token after successful login', () => {
      const mockResponse: AuthResponse = {
        access_token: 'new-token-456',
        token_type: 'bearer',
      };

      service.login('user', 'pass').subscribe(() => {
        expect(localStorage.getItem('taskman_access_token')).toBe('new-token-456');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      req.flush(mockResponse);
    });

    it('should handle login with special characters in credentials', () => {
      const username = 'user@example.com';
      const password = 'p@ss&word=123';

      service.login(username, password).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      expect(req.request.body).toBe('username=user@example.com&password=p@ss%26word=123');
      req.flush({ access_token: 'token', token_type: 'bearer' });
    });

    it('should not store token when response is missing access_token', () => {
      const mockResponse = {
        access_token: '',
        token_type: 'bearer',
      };

      service.login('user', 'pass').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      req.flush(mockResponse);

      expect(localStorage.getItem('taskman_access_token')).toBeNull();
    });

    it('should handle login error', () => {
      service.login('user', 'wrongpass').subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should not store token when response is null', () => {
      service.login('user', 'pass').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      req.flush(null);

      expect(localStorage.getItem('taskman_access_token')).toBeNull();
    });

    it('should extract and store user from a valid JWT token on login', () => {
      const token = createJwtToken({
        sub: 'jwtuser@example.com',
        exp: 999999,
        iat: 2,
        role: 'admin',
        user_id: 5,
      });

      service.login('user', 'pass').subscribe(() => {
        const storedUserStr = localStorage.getItem('taskman_user');
        expect(storedUserStr).not.toBeNull();

        const storedUser = JSON.parse(storedUserStr as string) as {
          id: number;
          email: string;
          is_admin: boolean;
          is_superadmin: boolean;
          created_at: string;
        };
        expect(storedUser.id).toBe(5);
        expect(storedUser.email).toBe('jwtuser@example.com');
        expect(storedUser.is_admin).toBe(true);
        expect(storedUser.is_superadmin).toBe(false);
        expect(storedUser.created_at).toBe(new Date(2 * 1000).toISOString());
        expect(service.isAdmin()).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      req.flush({ access_token: token, token_type: 'bearer' } as AuthResponse);
    });

    it("should set both is_admin and is_superadmin when JWT role is 'superadmin'", () => {
      const token = createJwtToken({
        sub: 'superadmin@example.com',
        exp: 999999,
        iat: 2,
        role: 'superadmin',
        user_id: 7,
      });

      service.login('user', 'pass').subscribe(() => {
        const storedUserStr = localStorage.getItem('taskman_user');
        expect(storedUserStr).not.toBeNull();

        const storedUser = JSON.parse(storedUserStr as string) as {
          id: number;
          email: string;
          is_admin: boolean;
          is_superadmin: boolean;
        };
        expect(storedUser.id).toBe(7);
        expect(storedUser.email).toBe('superadmin@example.com');
        expect(storedUser.is_admin).toBe(true);
        expect(storedUser.is_superadmin).toBe(true);
        expect(service.isAdmin()).toBe(true);
        expect(service.isSuperAdmin()).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      req.flush({ access_token: token, token_type: 'bearer' } as AuthResponse);
    });

    it('should use default values when JWT has no user_id, is_admin, or iat', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(10_000));
      const token = createJwtToken({
        sub: 'defaults@example.com',
        exp: 999999,
      });

      try {
        service.login('user', 'pass').subscribe(() => {
          const storedUserStr = localStorage.getItem('taskman_user');
          expect(storedUserStr).not.toBeNull();

          const storedUser = JSON.parse(storedUserStr as string) as {
            id: number;
            email: string;
            is_admin: boolean;
            is_superadmin: boolean;
            created_at: string;
          };
          expect(storedUser.id).toBe(0);
          expect(storedUser.email).toBe('defaults@example.com');
          expect(storedUser.is_admin).toBe(false);
          expect(storedUser.is_superadmin).toBe(false);
          expect(storedUser.created_at).toBe(new Date(10_000).toISOString());
          expect(service.isAdmin()).toBe(false);
        });

        const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
        req.flush({ access_token: token, token_type: 'bearer' } as AuthResponse);
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('should not store user when token is not a valid JWT', () => {
      service.login('user', 'pass').subscribe(() => {
        expect(localStorage.getItem('taskman_access_token')).toBe('not-a-jwt');
        expect(localStorage.getItem('taskman_user')).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      req.flush({ access_token: 'not-a-jwt', token_type: 'bearer' } as AuthResponse);
    });

    it('should handle localStorage errors when storing user gracefully', () => {
      const token = createJwtToken({
        sub: 'storageerror@example.com',
        exp: 999999,
        role: 'admin',
      });

      const originalSetItem = localStorage.setItem.bind(localStorage);
      spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
        if (key === 'taskman_user') {
          throw new Error('Storage error');
        }
        originalSetItem(key, value);
      });
      spyOn(console, 'error');

      service.login('user', 'pass').subscribe(() => {
        expect(localStorage.getItem('taskman_access_token')).toBe(token);
        expect(console.error).toHaveBeenCalledWith(
          'Failed to store user in localStorage:',
          jasmine.any(Error)
        );
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/user/token`);
      req.flush({ access_token: token, token_type: 'bearer' } as AuthResponse);
    });
  });

  describe('logout', () => {
    it('should clear access token from localStorage', () => {
      localStorage.setItem('taskman_access_token', 'test-token');
      service.logout();
      expect(localStorage.getItem('taskman_access_token')).toBeNull();
    });

    it('should clear token even if none exists', () => {
      service.logout();
      expect(localStorage.getItem('taskman_access_token')).toBeNull();
    });

    it('should handle localStorage errors when clearing stored user gracefully', () => {
      const originalRemoveItem = localStorage.removeItem.bind(localStorage);
      spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
        if (key === 'taskman_user') {
          throw new Error('Storage error');
        }
        originalRemoveItem(key);
      });
      spyOn(console, 'error');

      localStorage.setItem('taskman_access_token', 'test-token');
      localStorage.setItem(
        'taskman_user',
        JSON.stringify({
          id: 1,
          email: 'user@example.com',
          is_active: true,
          is_admin: false,
          is_superadmin: false,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        })
      );

      service.logout();

      expect(localStorage.getItem('taskman_access_token')).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear user from localStorage:',
        jasmine.any(Error)
      );
    });
  });
});
