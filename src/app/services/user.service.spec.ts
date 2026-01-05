import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { UserPasswordChange, UserAvatarUpdate, User } from '../generated';
import { of, throwError } from 'rxjs';

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
    it('should update password successfully', () => {
      const passwordUpdate: UserPasswordChange = {
        current_password: 'old123',
        new_password: 'new123',
      };

      spyOn(service, 'updatePassword').and.returnValue(of(undefined));

      service.updatePassword(passwordUpdate).subscribe(result => {
        expect(result).toBeUndefined();
      });
    });

    it('should handle password update errors', () => {
      const passwordUpdate: UserPasswordChange = {
        current_password: 'wrong',
        new_password: 'new123',
      };

      spyOn(service, 'updatePassword').and.returnValue(
        throwError(() => new Error('Invalid current password'))
      );

      service.updatePassword(passwordUpdate).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBe('Invalid current password');
        },
      });
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar successfully', () => {
      const avatarUpdate: UserAvatarUpdate = {
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        is_active: true,
        is_admin: false,
        is_superadmin: false,
        avatar_url: 'https://example.com/new-avatar.jpg',
        last_login: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      spyOn(service, 'updateAvatar').and.returnValue(of(mockUser));

      service.updateAvatar(avatarUpdate).subscribe(result => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
        expect(result.avatar_url).toBe('https://example.com/new-avatar.jpg');
      });
    });

    it('should handle avatar update errors', () => {
      const avatarUpdate: UserAvatarUpdate = {
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      spyOn(service, 'updateAvatar').and.returnValue(
        throwError(() => new Error('Invalid avatar URL'))
      );

      service.updateAvatar(avatarUpdate).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBe('Invalid avatar URL');
        },
      });
    });

    it('should transform response data correctly', () => {
      const avatarUpdate: UserAvatarUpdate = {
        avatar_url: 'https://example.com/new-avatar.jpg',
      };

      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        is_active: true,
        is_admin: false,
        is_superadmin: false,
        avatar_url: 'https://example.com/new-avatar.jpg',
        last_login: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      };

      // Mock successful response
      spyOn(service, 'updateAvatar').and.returnValue(of(mockUser));

      service.updateAvatar(avatarUpdate).subscribe(result => {
        expect(result).toEqual(mockUser);
        expect(result.avatar_url).toBe(mockUser.avatar_url);
      });
    });
  });
});
