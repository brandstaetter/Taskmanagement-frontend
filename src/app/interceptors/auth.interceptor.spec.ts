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
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken', 'logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/tasks' });

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
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Token Attachment', () => {
    it('should attach Bearer token to API requests when token is available', () => {
      const mockToken = 'test-token-123';
      authService.getAccessToken.and.returnValue(mockToken);

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should not attach token to non-API requests', () => {
      const mockToken = 'test-token-123';
      authService.getAccessToken.and.returnValue(mockToken);

      httpClient.get('https://external-api.com/data').subscribe();

      const req = httpMock.expectOne('https://external-api.com/data');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not attach token when no token is available', () => {
      authService.getAccessToken.and.returnValue(null);

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not attach token when token is empty string', () => {
      authService.getAccessToken.and.returnValue('');

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('401 Error Handling', () => {
    it('should call logout on 401 error', () => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should redirect to login with returnUrl on 401 error when not on login page', () => {
      authService.getAccessToken.and.returnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/tasks', writable: true });

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/tasks' },
      });
    });

    it('should not redirect when already on login page', () => {
      authService.getAccessToken.and.returnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/login', writable: true });

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not redirect when on login page with query params', () => {
      authService.getAccessToken.and.returnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/login?returnUrl=/tasks', writable: true });

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should propagate 401 error after handling', done => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Other Error Handling', () => {
    it('should not call logout on 403 error', () => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not call logout on 404 error', () => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should not call logout on 500 error', () => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should propagate non-401 errors unchanged', done => {
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: (error: HttpErrorResponse) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Request Handling', () => {
    it('should pass through successful requests', () => {
      const mockResponse = { data: 'test' };
      authService.getAccessToken.and.returnValue('test-token');

      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req.flush(mockResponse);
    });

    it('should handle POST requests with token', () => {
      const mockToken = 'test-token-123';
      const postData = { title: 'New Task' };
      authService.getAccessToken.and.returnValue(mockToken);

      httpClient.post(`${environment.apiUrl}/v1/tasks`, postData).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(req.request.body).toEqual(postData);
      req.flush({});
    });

    it('should handle PUT requests with token', () => {
      const mockToken = 'test-token-123';
      const updateData = { title: 'Updated Task' };
      authService.getAccessToken.and.returnValue(mockToken);

      httpClient.put(`${environment.apiUrl}/v1/tasks/1`, updateData).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });

    it('should handle DELETE requests with token', () => {
      const mockToken = 'test-token-123';
      authService.getAccessToken.and.returnValue(mockToken);

      httpClient.delete(`${environment.apiUrl}/v1/tasks/1`).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/v1/tasks/1`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      req.flush({});
    });
  });

  describe('Multiple Interceptor Scenarios', () => {
    it('should handle multiple sequential 401 errors', () => {
      authService.getAccessToken.and.returnValue('test-token');
      Object.defineProperty(router, 'url', { value: '/tasks', writable: true });

      // First request
      httpClient.get(`${environment.apiUrl}/v1/tasks`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req1 = httpMock.expectOne(`${environment.apiUrl}/v1/tasks`);
      req1.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      // Second request
      httpClient.get(`${environment.apiUrl}/v1/users`).subscribe({
        error: () => {
          // Expected error
        },
      });

      const req2 = httpMock.expectOne(`${environment.apiUrl}/v1/users`);
      req2.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(authService.logout).toHaveBeenCalledTimes(2);
      expect(router.navigate).toHaveBeenCalledTimes(2);
    });
  });
});
