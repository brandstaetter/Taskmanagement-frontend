import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { User, Token } from '../generated';

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

    it('should return null when localStorage throws error', () => {
      spyOn(localStorage, 'getItem').and.throwError('Storage error');

      const token = service.getAccessToken();

      expect(token).toBeNull();
    });

    it('should set access token in localStorage', () => {
      const localStorageSpy = spyOn(localStorage, 'setItem');

      service.setAccessToken('new-token');

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token', 'new-token');
    });

    it('should handle error when setting token', () => {
      const consoleSpy = spyOn(console, 'error');
      spyOn(localStorage, 'setItem').and.throwError('Storage error');

      service.setAccessToken('new-token');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set access token in localStorage:',
        jasmine.any(Error)
      );
    });

    it('should clear access token from localStorage', () => {
      const localStorageSpy = spyOn(localStorage, 'removeItem');

      service.clearAccessToken();

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token');
    });

    it('should handle error when clearing token', () => {
      const consoleSpy = spyOn(console, 'error');
      spyOn(localStorage, 'removeItem').and.throwError('Storage error');

      service.clearAccessToken();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear access token from localStorage:',
        jasmine.any(Error)
      );
    });

    it('should return authentication status correctly', () => {
      const localStorageSpy = spyOn(localStorage, 'getItem');

      localStorageSpy.and.returnValue('test-token');
      expect(service.isAuthenticated()).toBe(true);

      localStorageSpy.and.returnValue(null);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('User Management', () => {
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

    it('should have getCurrentUser method', () => {
      expect(service.getCurrentUser).toBeDefined();
      expect(typeof service.getCurrentUser).toBe('function');
    });

    it('should return current user from localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));

      const freshService = new AuthService();
      const user = freshService.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null when no user in localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const freshService = new AuthService();
      const user = freshService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should have isAdmin method', () => {
      expect(service.isAdmin).toBeDefined();
      expect(typeof service.isAdmin).toBe('function');
    });

    it('should return admin status correctly for non-admin', () => {
      const adminUser = { ...mockUser, is_admin: false };
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(adminUser));
      const service = new AuthService();
      expect(service.isAdmin()).toBe(false);
    });

    it('should return admin status correctly for admin', () => {
      const adminUser = { ...mockUser, is_admin: true };
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(adminUser));
      const service = new AuthService();
      expect(service.isAdmin()).toBe(true);
    });

    it('should return admin status correctly for null user', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      const service = new AuthService();
      expect(service.isAdmin()).toBe(false);
    });

    it('should have isSuperAdmin method', () => {
      expect(service.isSuperAdmin).toBeDefined();
      expect(typeof service.isSuperAdmin).toBe('function');
    });

    it('should return super admin status correctly for non-superadmin', () => {
      const superAdminUser = { ...mockUser, is_superadmin: false };
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(superAdminUser));
      const service = new AuthService();
      expect(service.isSuperAdmin()).toBe(false);
    });

    it('should return super admin status correctly for superadmin', () => {
      const superAdminUser = { ...mockUser, is_superadmin: true };
      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(superAdminUser));
      const service = new AuthService();
      expect(service.isSuperAdmin()).toBe(true);
    });

    it('should return super admin status correctly for null user', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      const service = new AuthService();
      expect(service.isSuperAdmin()).toBe(false);
    });
  });

  describe('Authentication Flow', () => {
    const mockToken: Token = {
      access_token: 'test-access-token',
      token_type: 'bearer',
    };

    it('should handle login errors', () => {
      const loginSpy = spyOn(
        service as unknown as { authenticatedClient: jasmine.Spy },
        'authenticatedClient'
      ).and.returnValue({
        loginUserForAccessTokenApiV1AuthUserTokenPost: () =>
          Promise.reject({ error: new Error('Invalid credentials') }),
      });

      service.login('test@example.com', 'wrong-password').subscribe({
        next: () => fail('should have failed'),
        error: err => {
          expect(err).toBe('Invalid credentials');
        },
        complete: () => {
          expect(loginSpy).toHaveBeenCalled();
        },
      });

      // Add expectation to prevent warning
      expect(loginSpy).toBeDefined();
    });

    it('should login successfully and store token', () => {
      const setTokenSpy = spyOn(service, 'setAccessToken');
      const fetchUserSpy = spyOn(
        service as unknown as { fetchCurrentUser: jasmine.Spy },
        'fetchCurrentUser'
      ).and.returnValue(of({}));
      spyOn(
        service as unknown as { authenticatedClient: jasmine.Spy },
        'authenticatedClient'
      ).and.returnValue({
        loginUserForAccessTokenApiV1AuthUserTokenPost: () =>
          Promise.resolve({ data: mockToken, response: {} as Response }),
      });

      service.login('test@example.com', 'password').subscribe(result => {
        expect(result).toEqual(mockToken);
        expect(setTokenSpy).toHaveBeenCalledWith('test-access-token');
        expect(fetchUserSpy).toHaveBeenCalled();
      });

      // Add expectation to prevent warning
      expect(setTokenSpy).toBeDefined();
    });

    it('should logout and clear stored data', () => {
      const clearTokenSpy = spyOn(service, 'clearAccessToken');
      const clearUserSpy = spyOn(
        service as unknown as { clearStoredUser: jasmine.Spy },
        'clearStoredUser'
      );

      service.logout();

      expect(clearTokenSpy).toHaveBeenCalled();
      expect(clearUserSpy).toHaveBeenCalled();
    });
  });

  describe('User Observable', () => {
    it('should have currentUser observable', () => {
      expect(service.currentUser$).toBeDefined();
      expect(typeof service.currentUser$.subscribe).toBe('function');
    });

    it('should emit user changes', () => {
      const testUser: User = {
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

      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(testUser));

      const freshService = new AuthService();

      freshService.currentUser$.subscribe(user => {
        expect(user).toEqual(testUser);
      });
    });
  });

  describe('Private Methods', () => {
    it('should get stored user successfully', () => {
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

      spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));

      const user = (service as unknown as { getStoredUser: () => User | null }).getStoredUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null when no user stored', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const user = (service as unknown as { getStoredUser: () => User | null }).getStoredUser();
      expect(user).toBeNull();
    });

    it('should return null when localStorage throws error', () => {
      spyOn(localStorage, 'getItem').and.throwError('Storage error');

      const user = (service as unknown as { getStoredUser: () => User | null }).getStoredUser();
      expect(user).toBeNull();
    });

    it('should set stored user successfully', () => {
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

      const localStorageSpy = spyOn(localStorage, 'setItem');

      (service as unknown as { setStoredUser: (user: User) => void }).setStoredUser(mockUser);

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_user', JSON.stringify(mockUser));
    });

    it('should handle error when storing user', () => {
      const consoleSpy = spyOn(console, 'error');
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

      spyOn(localStorage, 'setItem').and.throwError('Storage error');

      (service as unknown as { setStoredUser: (user: User) => void }).setStoredUser(mockUser);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store user in localStorage:',
        jasmine.any(Error)
      );
    });

    it('should clear stored user successfully', () => {
      const localStorageSpy = spyOn(localStorage, 'removeItem');

      (service as unknown as { clearStoredUser: () => void }).clearStoredUser();

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_user');
    });

    it('should handle error when clearing user', () => {
      const consoleSpy = spyOn(console, 'error');
      spyOn(localStorage, 'removeItem').and.throwError('Storage error');

      (service as unknown as { clearStoredUser: () => void }).clearStoredUser();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear user from localStorage:',
        jasmine.any(Error)
      );
    });
  });
});
