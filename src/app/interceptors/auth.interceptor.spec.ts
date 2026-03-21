import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    const authServiceSpy = {
      getAccessToken: jest.fn(),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    const routerSpy = { navigate: jest.fn(), url: '/tasks' } as unknown as jest.Mocked<Router>;
    routerSpy.navigate.mockReturnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Token Attachment', () => {
    it('should attach Bearer token to API requests when token is available', () => {
      const mockToken = 'test-token-123';
      authService.getAccessToken.mockReturnValue(mockToken);

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should not attach token to non-API requests', () => {
      const mockToken = 'test-token-123';
      authService.getAccessToken.mockReturnValue(mockToken);

      httpClient.get('https://external-api.com/data').subscribe();

      const req = httpMock.expectOne('https://external-api.com/data');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not attach token when no token is available', () => {
      authService.getAccessToken.mockReturnValue(null);

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not attach token when token is empty string', () => {
      authService.getAccessToken.mockReturnValue('');

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('401 Error Handling', () => {
    it('should call logout on 401 error', () => {
      authService.getAccessToken.mockReturnValue('test-token');

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should redirect to login with returnUrl on 401 error when not on login page', () => {
      authService.getAccessToken.mockReturnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/tasks', writable: true });

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/tasks' },
      });
    });

    it('should not redirect when already on login page', () => {
      authService.getAccessToken.mockReturnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/login', writable: true });

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not redirect when on login page with query params', () => {
      authService.getAccessToken.mockReturnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/login?returnUrl=/tasks', writable: true });

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should propagate 401 error after handling', done => {
      authService.getAccessToken.mockReturnValue('test-token');

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Other Error Handling', () => {
    it('should not call logout on 403 error', () => {
      authService.getAccessToken.mockReturnValue('test-token');

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not call logout on 404 error', () => {
      authService.getAccessToken.mockReturnValue('test-token');

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not call logout on 500 error', () => {
      authService.getAccessToken.mockReturnValue('test-token');

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should propagate non-401 errors unchanged', done => {
      authService.getAccessToken.mockReturnValue('test-token');

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Request Handling', () => {
    it('should pass through successful requests', () => {
      const mockResponse = { data: 'test' };
      authService.getAccessToken.mockReturnValue('test-token');

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req.flush(mockResponse);
    });

    it('should handle POST requests with token', () => {
      const mockToken = 'test-token-123';
      const postData = { title: 'New Task' };
      authService.getAccessToken.mockReturnValue(mockToken);

      httpClient.post(`${environment.baseUrl}/v1/tasks`, postData).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual(postData);
      req.flush({});
    });

    it('should handle PUT requests with token', () => {
      const mockToken = 'test-token-123';
      const updateData = { title: 'Updated Task' };
      authService.getAccessToken.mockReturnValue(mockToken);

      httpClient.put(`${environment.baseUrl}/v1/tasks/1`, updateData).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should handle DELETE requests with token', () => {
      const mockToken = 'test-token-123';
      authService.getAccessToken.mockReturnValue(mockToken);

      httpClient.delete(`${environment.baseUrl}/v1/tasks/1`).subscribe();

      const req = httpMock.expectOne(`${environment.baseUrl}/v1/tasks/1`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });
  });

  describe('Multiple Interceptor Scenarios', () => {
    it('should only logout and navigate once when concurrent 401 responses arrive', () => {
      authService.getAccessToken.mockReturnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/tasks', writable: true });

      // Both requests in-flight before either response arrives
      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });
      httpClient.get(`${environment.baseUrl}/v1/users`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req1 = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      const req2 = httpMock.expectOne(`${environment.baseUrl}/v1/users`);

      // Both return 401 before the navigation promise resolves
      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledTimes(1);
    });

    it('should reset isLoggingOut after navigation failure so future 401s still trigger logout', async () => {
      authService.getAccessToken.mockReturnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/tasks', writable: true });
      router.navigate.mockReturnValue(Promise.reject(new Error('Navigation failed')));

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });
      const req1 = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      // Wait for the rejected navigate promise's finally() to run
      await Promise.resolve();

      httpClient.get(`${environment.baseUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });
      const req2 = httpMock.expectOne(`${environment.baseUrl}/v1/tasks`);
      req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalledTimes(2);
    });
  });
});
