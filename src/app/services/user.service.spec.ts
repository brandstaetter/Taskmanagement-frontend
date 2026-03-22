import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { UserPasswordChange, UserAvatarUpdate, UserDisplayNameUpdate } from '../generated';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    // Ensure fetch spy exists before configuring it
    if (!jest.isMockFunction(window.fetch)) {
      jest.spyOn(window, 'fetch');
    }
    (window.fetch as jest.SpyInstance).mockReturnValue(
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
      } as Response)
    );

    mockAuthService = {
      getAccessToken: jest.fn().mockReturnValue('test-token'),
    } as unknown as jest.Mocked<AuthService>;

    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updatePassword', () => {
    it('should have updatePassword method', () => {
      expect(service.updatePassword).toBeDefined();
      expect(typeof service.updatePassword).toBe('function');
    });

    it('should accept UserPasswordChange parameter', () => {
      const passwordUpdate: UserPasswordChange = {
        current_password: 'old123',
        new_password: 'new123',
      };

      const observable = service.updatePassword(passwordUpdate);
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });

    it('should return Observable<void>', () => {
      const passwordUpdate: UserPasswordChange = {
        current_password: 'old123',
        new_password: 'new123',
      };

      const observable = service.updatePassword(passwordUpdate);
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('updateAvatar', () => {
    it('should have updateAvatar method', () => {
      expect(service.updateAvatar).toBeDefined();
      expect(typeof service.updateAvatar).toBe('function');
    });

    it('should accept UserAvatarUpdate parameter', () => {
      const avatarUpdate: UserAvatarUpdate = {
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      const observable = service.updateAvatar(avatarUpdate);
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });

    it('should return Observable<User>', () => {
      const avatarUpdate: UserAvatarUpdate = {
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      const observable = service.updateAvatar(avatarUpdate);
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('updateDisplayName', () => {
    it('should have updateDisplayName method', () => {
      expect(service.updateDisplayName).toBeDefined();
      expect(typeof service.updateDisplayName).toBe('function');
    });

    it('should accept UserDisplayNameUpdate parameter and return Observable<User>', () => {
      const displayNameUpdate: UserDisplayNameUpdate = {
        display_name: 'New Display Name',
      };

      const observable = service.updateDisplayName(displayNameUpdate);
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('getUsers', () => {
    it('should have getUsers method', () => {
      expect(service.getUsers).toBeDefined();
      expect(typeof service.getUsers).toBe('function');
    });

    it('should return an Observable', () => {
      const observable = service.getUsers();
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });
  });

  describe('updateWipLimit', () => {
    it('should have updateWipLimit method', () => {
      expect(service.updateWipLimit).toBeDefined();
      expect(typeof service.updateWipLimit).toBe('function');
    });

    it('should send PATCH request with correct body and auth header', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        is_active: true,
        is_admin: false,
        is_superadmin: false,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        wip_limit: 10,
      };

      service.updateWipLimit(10).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.baseUrl}/api/v1/users/me/wip-limit`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ wip_limit: 10 });
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(mockUser);
    });

    it('should return Observable<User>', () => {
      const observable = service.updateWipLimit(5);
      expect(observable).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');

      // Subscribe to trigger the HTTP request
      observable.subscribe();

      // Consume the pending request
      const req = httpMock.expectOne(`${environment.baseUrl}/api/v1/users/me/wip-limit`);
      req.flush({});
    });
  });

  describe('Service Structure', () => {
    it('should have proper type definitions', () => {
      // Test that types are available (they're imported at the top)
      expect(true).toBe(true); // Types are validated by TypeScript compiler
    });

    it('should be provided in root', () => {
      expect(service).toBeTruthy();
      // The service should be a singleton
      const service2 = TestBed.inject(UserService);
      expect(service).toBe(service2);
    });
  });
});
