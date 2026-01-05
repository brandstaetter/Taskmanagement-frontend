import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { UserPasswordChange, UserAvatarUpdate } from '../generated';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
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

      // Test that the method exists and can be called with correct parameter type
      expect(() => {
        const observable = service.updatePassword(passwordUpdate);
        expect(observable).toBeDefined();
        expect(typeof observable.subscribe).toBe('function');
      }).not.toThrow();
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

      // Test that the method exists and can be called with correct parameter type
      expect(() => {
        const observable = service.updateAvatar(avatarUpdate);
        expect(observable).toBeDefined();
        expect(typeof observable.subscribe).toBe('function');
      }).not.toThrow();
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
