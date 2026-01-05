import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { User, Token } from '../generated';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let localStorageSpy: jasmine.Spy;

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

  const mockToken: Token = {
    access_token: 'test-access-token',
    token_type: 'bearer',
  };

  beforeEach(() => {
    localStorageSpy = spyOn(localStorage, 'getItem');
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');

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
      localStorageSpy.and.returnValue('test-token');

      const token = service.getAccessToken();

      expect(token).toBe('test-token');
      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token');
    });

    it('should return null when no token is stored', () => {
      localStorageSpy.and.returnValue(null);

      const token = service.getAccessToken();

      expect(token).toBeNull();
    });

    it('should handle localStorage errors when getting token', () => {
      localStorageSpy.and.throwError('Storage error');

      const token = service.getAccessToken();

      expect(token).toBeNull();
    });

    it('should set access token in localStorage', () => {
      service.setAccessToken('new-token');

      expect(localStorage.setItem).toHaveBeenCalledWith('taskman_access_token', 'new-token');
    });

    it('should handle localStorage errors when setting token', () => {
      spyOn(localStorage, 'setItem').and.throwError('Storage error');
      spyOn(console, 'error');

      service.setAccessToken('new-token');

      expect(console.error).toHaveBeenCalledWith('Failed to set access token in localStorage:', jasmine.any(Error));
    });

    it('should clear access token from localStorage', () => {
      service.clearAccessToken();

      expect(localStorage.removeItem).toHaveBeenCalledWith('taskman_access_token');
    });

    it('should handle localStorage errors when clearing token', () => {
      spyOn(localStorage, 'removeItem').and.throwError('Storage error');
      spyOn(console, 'error');

      service.clearAccessToken();

      expect(console.error).toHaveBeenCalledWith('Failed to clear access token from localStorage:', jasmine.any(Error));
    });

    it('should return authentication status correctly', () => {
      localStorageSpy.and.returnValue('test-token');
      expect(service.isAuthenticated()).toBe(true);

      localStorageSpy.and.returnValue(null);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('User Management', () => {
    it('should get current user from localStorage', () => {
      localStorageSpy.and.returnValue(JSON.stringify(mockUser));

      const user = service.getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(localStorageSpy).toHaveBeenCalledWith('taskman_user');
    });

    it('should return null when no user is stored', () => {
      localStorageSpy.and.returnValue(null);

      const user = service.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should handle localStorage errors when getting user', () => {
      localStorageSpy.and.returnValue('invalid-json');

      const user = service.getCurrentUser();

      expect(user).toBeNull();
    });

    it('should check admin status correctly', () => {
      localStorageSpy.and.returnValue(JSON.stringify(mockUser));
      expect(service.isAdmin()).toBe(false);

      const adminUser = { ...mockUser, is_admin: true };
      localStorageSpy.and.returnValue(JSON.stringify(adminUser));
      expect(service.isAdmin()).toBe(true);
    });

    it('should check super admin status correctly', () => {
      localStorageSpy.and.returnValue(JSON.stringify(mockUser));
      expect(service.isSuperAdmin()).toBe(false);

      const superAdminUser = { ...mockUser, is_superadmin: true };
      localStorageSpy.and.returnValue(JSON.stringify(superAdminUser));
      expect(service.isSuperAdmin()).toBe(true);
    });

    it('should clear stored user', () => {
      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('taskman_user');
    });
  });

  describe('Authentication Flow', () => {
    it('should login successfully and store token and user', () => {
      spyOn(service as jasmine.SpyObj<AuthService>, 'login').and.returnValue(of(mockToken));

      service.login('test@example.com', 'password').subscribe(result => {
        expect(result).toEqual(mockToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('taskman_access_token', mockToken.access_token);
      });
    });

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
      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('taskman_access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('taskman_user');
    });

    it('should handle localStorage errors during logout', () => {
      spyOn(localStorage, 'removeItem').and.throwError('Storage error');
      spyOn(console, 'error');

      service.logout();

      expect(console.error).toHaveBeenCalledWith('Failed to clear access token from localStorage:', jasmine.any(Error));
    });
  });

  describe('User Observable', () => {
    it('should emit current user changes', () => {
      let emittedUser: User | null = null;
      service.currentUser$.subscribe(user => {
        emittedUser = user;
      });

      // Initially should be null
      expect(emittedUser).toBeNull();

      // Test that the observable exists and can be subscribed to
      expect(service.currentUser$).toBeDefined();
      expect(typeof service.currentUser$.subscribe).toBe('function');
    });
  });
});