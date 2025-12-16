import { TestBed } from '@angular/core/testing';
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

      const req = httpMock.expectOne(`${apiUrl}/auth/token`);
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

      const req = httpMock.expectOne(`${apiUrl}/auth/token`);
      req.flush(mockResponse);
    });

    it('should handle login with special characters in credentials', () => {
      const username = 'user@example.com';
      const password = 'p@ss&word=123';

      service.login(username, password).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/token`);
      // HttpParams encodes & but not @ or = in URL encoding
      expect(req.request.body).toBe('username=user@example.com&password=p@ss%26word=123');
      req.flush({ access_token: 'token', token_type: 'bearer' });
    });

    it('should not store token when response is missing access_token', () => {
      const mockResponse = {
        access_token: '',
        token_type: 'bearer',
      };

      service.login('user', 'pass').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/token`);
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

      const req = httpMock.expectOne(`${apiUrl}/auth/token`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
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
  });
});
