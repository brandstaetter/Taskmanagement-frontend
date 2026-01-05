import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Token Management', () => {
    it('should get access token from localStorage', () => {
      const localStorageSpy = spyOn(localStorage, 'getItem').and.returnValue('test-token');

      const token = service.getAccessToken();

      expect(token).toBe('test-token');
      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token');
    });

    it('should return null when no token is stored', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const token = service.getAccessToken();

      expect(token).toBeNull();
    });

    it('should set access token in localStorage', () => {
      const localStorageSpy = spyOn(localStorage, 'setItem');

      service.setAccessToken('new-token');

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token', 'new-token');
    });

    it('should clear access token from localStorage', () => {
      const localStorageSpy = spyOn(localStorage, 'removeItem');

      service.clearAccessToken();

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token');
    });

    it('should return authentication status correctly', () => {
      const localStorageSpy = spyOn(localStorage, 'getItem');
      
      localStorageSpy.and.returnValue('test-token');
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('User Management', () => {
    it('should have getCurrentUser method', () => {
      expect(service.getCurrentUser).toBeDefined();
      expect(typeof service.getCurrentUser).toBe('function');
    });

    it('should have isAdmin method', () => {
      expect(service.isAdmin).toBeDefined();
      expect(typeof service.isAdmin).toBe('function');
    });

    it('should have isSuperAdmin method', () => {
      expect(service.isSuperAdmin).toBeDefined();
      expect(typeof service.isSuperAdmin).toBe('function');
    });
  });

  describe('Authentication Flow', () => {
    it('should handle login errors', () => {
      spyOn(service as jasmine.SpyObj<AuthService>, 'login').and.returnValue(
        throwError(() => new Error('Invalid credentials'))
      );

      service.login('test@example.com', 'wrong-password').subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBe('Invalid credentials');
        },
      });
    });

    it('should logout and clear stored data', () => {
      const localStorageSpy = spyOn(localStorage, 'removeItem');

      service.logout();

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token');
      expect(localStorageSpy).toHaveBeenCalledWith('taskman_user');
    });
  });

  describe('User Observable', () => {
    it('should have currentUser observable', () => {
      expect(service.currentUser$).toBeDefined();
      expect(typeof service.currentUser$.subscribe).toBe('function');
    });
  });
});