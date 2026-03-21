import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { User, Token } from '../generated';
import {
  loginUserForAccessTokenApiV1AuthUserTokenPost,
  getCurrentUserInfoApiV1UsersMeGet,
} from '../generated';

// Mock the generated SDK functions
jest.mock('../generated/sdk.gen', () => ({
  ...jest.requireActual('../generated/sdk.gen'),
  loginUserForAccessTokenApiV1AuthUserTokenPost: jest.fn(),
  getCurrentUserInfoApiV1UsersMeGet: jest.fn(),
}));

const mockLoginFn = loginUserForAccessTokenApiV1AuthUserTokenPost as jest.Mock;
const mockGetCurrentUserFn = getCurrentUserInfoApiV1UsersMeGet as jest.Mock;

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
      const localStorageSpy = jest
        .spyOn(Storage.prototype, 'getItem')
        .mockReturnValue('test-token');

      const token = service.getAccessToken();

      expect(token).toBe('test-token');
      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token');
    });

    it('should return null when no token is stored', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      const token = service.getAccessToken();

      expect(token).toBeNull();
    });

    it('should return null when localStorage throws error', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const token = service.getAccessToken();

      expect(token).toBeNull();
    });

    it('should set access token in localStorage', () => {
      const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

      service.setAccessToken('new-token');

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token', 'new-token');
    });

    it('should handle error when setting token', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      service.setAccessToken('new-token');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set access token in localStorage:',
        expect.any(Error)
      );
    });

    it('should clear access token from localStorage', () => {
      const localStorageSpy = jest.spyOn(Storage.prototype, 'removeItem');

      service.clearAccessToken();

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_access_token');
    });

    it('should handle error when clearing token', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      service.clearAccessToken();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear access token from localStorage:',
        expect.any(Error)
      );
    });

    it('should return authentication status correctly', () => {
      const localStorageSpy = jest.spyOn(Storage.prototype, 'getItem');
      jest.spyOn(Storage.prototype, 'removeItem'); // prevent logout side-effects

      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `header.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;

      localStorageSpy.mockReturnValue(validToken);
      expect(service.isAuthenticated()).toBe(true);

      localStorageSpy.mockReturnValue(null);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false for an expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 60;
      const expiredToken = `header.${btoa(JSON.stringify({ exp: pastExp }))}.signature`;
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(expiredToken);
      jest.spyOn(Storage.prototype, 'removeItem');

      expect(service.isAuthenticated()).toBe(false);
    });

    it('should call logout when token is expired', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 60;
      const expiredToken = `header.${btoa(JSON.stringify({ exp: pastExp }))}.signature`;
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(expiredToken);
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      service.isAuthenticated();

      expect(removeItemSpy).toHaveBeenCalledWith('taskman_access_token');
    });

    it('should return true for a valid token with future exp', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = `header.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(validToken);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false for a malformed token', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('not-a-valid-jwt');
      jest.spyOn(Storage.prototype, 'removeItem');

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
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockUser));

      const freshService = new AuthService();
      const user = freshService.getCurrentUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null when no user in localStorage', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

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
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(adminUser));
      const service = new AuthService();
      expect(service.isAdmin()).toBe(false);
    });

    it('should return admin status correctly for admin', () => {
      const adminUser = { ...mockUser, is_admin: true };
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(adminUser));
      const service = new AuthService();
      expect(service.isAdmin()).toBe(true);
    });

    it('should return admin status correctly for null user', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const service = new AuthService();
      expect(service.isAdmin()).toBe(false);
    });

    it('should have isSuperAdmin method', () => {
      expect(service.isSuperAdmin).toBeDefined();
      expect(typeof service.isSuperAdmin).toBe('function');
    });

    it('should return super admin status correctly for non-superadmin', () => {
      const superAdminUser = { ...mockUser, is_superadmin: false };
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(superAdminUser));
      const service = new AuthService();
      expect(service.isSuperAdmin()).toBe(false);
    });

    it('should return super admin status correctly for superadmin', () => {
      const superAdminUser = { ...mockUser, is_superadmin: true };
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(superAdminUser));
      const service = new AuthService();
      expect(service.isSuperAdmin()).toBe(true);
    });

    it('should return super admin status correctly for null user', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      const service = new AuthService();
      expect(service.isSuperAdmin()).toBe(false);
    });
  });

  describe('Authentication Flow', () => {
    it('should handle login errors', async () => {
      const apiError = { detail: 'Invalid credentials' };
      mockLoginFn.mockReturnValue(
        Promise.resolve({ data: undefined, error: apiError, response: {} as Response })
      );

      await expect(
        new Promise((resolve, reject) => {
          service.login('test@example.com', 'wrong-password').subscribe({
            next: resolve,
            error: reject,
          });
        })
      ).rejects.toEqual(apiError);
    });

    it('should not set token when response has no access token', async () => {
      const responseData = { access_token: null, token_type: 'bearer' } as unknown as Token;
      mockLoginFn.mockReturnValue(
        Promise.resolve({ data: responseData, error: undefined, response: {} as Response })
      );
      const setTokenSpy = jest.spyOn(service, 'setAccessToken');

      const result = await new Promise<Token>(resolve => {
        service.login('test@example.com', 'password').subscribe(resolve);
      });

      expect(result).toEqual(responseData);
      expect(setTokenSpy).not.toHaveBeenCalled();
    });

    it('should set token and fetch user when login succeeds with token', async () => {
      const responseData: Token = { access_token: 'new-token', token_type: 'bearer' };
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        is_active: true,
        is_admin: false,
        is_superadmin: false,
        avatar_url: null,
        last_login: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      mockLoginFn.mockReturnValue(
        Promise.resolve({ data: responseData, error: undefined, response: {} as Response })
      );
      mockGetCurrentUserFn.mockReturnValue(
        Promise.resolve({ data: mockUser, error: undefined, response: {} as Response })
      );
      const setTokenSpy = jest.spyOn(service, 'setAccessToken');
      jest.spyOn(Storage.prototype, 'setItem');

      const result = await new Promise<Token>(resolve => {
        service.login('test@example.com', 'password').subscribe(resolve);
      });

      expect(result).toEqual(responseData);
      expect(setTokenSpy).toHaveBeenCalledWith('new-token');
      expect(mockGetCurrentUserFn).toHaveBeenCalled();
    });

    it('should handle getAuthSecurity when token exists', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
      // Mock fetch to prevent real HTTP calls
      if (!jest.isMockFunction(window.fetch)) {
        jest.spyOn(window, 'fetch');
      }
      (window.fetch as jest.SpyInstance).mockReturnValue(
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );

      const security = (
        service as unknown as {
          getAuthSecurity: () => { scheme: string; type: string }[] | undefined;
        }
      ).getAuthSecurity();

      expect(security).toEqual([{ scheme: 'bearer', type: 'http' }]);
    });

    it('should handle getAuthSecurity when token is null', fakeAsync(() => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      // Mock fetch to prevent real HTTP calls
      if (!jest.isMockFunction(window.fetch)) {
        jest.spyOn(window, 'fetch');
      }
      (window.fetch as jest.SpyInstance).mockReturnValue(
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );

      const security = (
        service as unknown as {
          getAuthSecurity: () => { scheme: string; type: string }[] | undefined;
        }
      ).getAuthSecurity();

      expect(security).toBeUndefined();
      tick();
    }));

    it('should handle getAuthSecurity when token is empty string', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('');
      // Mock fetch to prevent real HTTP calls
      if (!jest.isMockFunction(window.fetch)) {
        jest.spyOn(window, 'fetch');
      }
      (window.fetch as jest.SpyInstance).mockReturnValue(
        Promise.resolve(
          new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      );

      const security = (
        service as unknown as {
          getAuthSecurity: () => { scheme: string; type: string }[] | undefined;
        }
      ).getAuthSecurity();

      expect(security).toBeUndefined();
    });

    it('should handle getStoredUser when JSON parsing fails', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid-json');

      const user = (service as unknown as { getStoredUser: () => User | null }).getStoredUser();

      expect(user).toBeNull();
    });

    it('should handle handleApiResponse when error exists', () => {
      const error = new Error('Test error');
      const response = { data: null, error, response: {} as Response };

      expect(() => {
        (
          service as unknown as { handleApiResponse: (response: unknown) => unknown }
        ).handleApiResponse(response);
      }).toThrow(new Error('Test error'));
    });

    it('should handle handleApiResponse when no error exists', () => {
      const data = { test: 'data' };
      const response = { data, error: undefined, response: {} as Response };

      const result = (
        service as unknown as { handleApiResponse: (response: unknown) => unknown }
      ).handleApiResponse(response);

      expect(result).toEqual(data);
    });

    it('should handle fetchCurrentUser error', async () => {
      const apiError = { detail: 'API Error' };
      mockGetCurrentUserFn.mockReturnValue(
        Promise.resolve({ data: undefined, error: apiError, response: {} as Response })
      );

      await expect(
        new Promise((resolve, reject) => {
          (service as unknown as { fetchCurrentUser: () => Observable<User> })
            .fetchCurrentUser()
            .subscribe({ next: resolve, error: reject });
        })
      ).rejects.toEqual(apiError);
    });

    it('should have all required methods', () => {
      expect(typeof service.getCurrentUser).toBe('function');
      expect(typeof service.isAdmin).toBe('function');
      expect(typeof service.isSuperAdmin).toBe('function');
      expect(typeof service.getAccessToken).toBe('function');
      expect(typeof service.isAuthenticated).toBe('function');
      expect(typeof service.setAccessToken).toBe('function');
      expect(typeof service.clearAccessToken).toBe('function');
      expect(typeof service.login).toBe('function');
      expect(typeof service.logout).toBe('function');
    });

    it('should logout and clear stored data', () => {
      const clearTokenSpy = jest.spyOn(service, 'clearAccessToken');
      const clearUserSpy = jest.spyOn(
        service as unknown as { clearStoredUser: jest.SpyInstance },
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

      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(testUser));

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

      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockUser));

      const user = (service as unknown as { getStoredUser: () => User | null }).getStoredUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null when no user stored', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

      const user = (service as unknown as { getStoredUser: () => User | null }).getStoredUser();
      expect(user).toBeNull();
    });

    it('should return null when localStorage throws error', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

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

      const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

      (service as unknown as { setStoredUser: (user: User) => void }).setStoredUser(mockUser);

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_user', JSON.stringify(mockUser));
    });

    it('should handle error when storing user', () => {
      const consoleSpy = jest.spyOn(console, 'error');
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

      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      (service as unknown as { setStoredUser: (user: User) => void }).setStoredUser(mockUser);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store user in localStorage:',
        expect.any(Error)
      );
    });

    it('should clear stored user successfully', () => {
      const localStorageSpy = jest.spyOn(Storage.prototype, 'removeItem');

      (service as unknown as { clearStoredUser: () => void }).clearStoredUser();

      expect(localStorageSpy).toHaveBeenCalledWith('taskman_user');
    });

    it('should handle error when clearing user', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      (service as unknown as { clearStoredUser: () => void }).clearStoredUser();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear user from localStorage:',
        expect.any(Error)
      );
    });
  });
});
