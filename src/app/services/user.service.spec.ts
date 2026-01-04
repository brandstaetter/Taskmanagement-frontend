import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { UserPasswordChange, UserAvatarUpdate } from '../generated';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

describe('UserService', () => {
  let service: UserService;
  let authService: jasmine.SpyObj<AuthService>;

  const mockUser = {
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

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    TestBed.configureTestingModule({
      providers: [UserService, { provide: AuthService, useValue: authService }],
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct method signatures', () => {
    expect(service.updatePassword).toBeDefined();
    expect(service.updateAvatar).toBeDefined();
  });

  it('should handle updatePassword with correct type', () => {
    const passwordUpdate: UserPasswordChange = {
      current_password: 'old123',
      new_password: 'new123',
    };

    const updatePasswordSpy = spyOn(service, 'updatePassword').and.returnValue(of(undefined));

    service.updatePassword(passwordUpdate).subscribe();

    expect(updatePasswordSpy).toHaveBeenCalledWith(passwordUpdate);
  });

  it('should handle updateAvatar with correct type', () => {
    const avatarUpdate: UserAvatarUpdate = {
      avatar_url: 'https://example.com/avatar.jpg',
    };

    const updateAvatarSpy = spyOn(service, 'updateAvatar').and.returnValue(of(mockUser));

    service.updateAvatar(avatarUpdate).subscribe();

    expect(updateAvatarSpy).toHaveBeenCalledWith(avatarUpdate);
  });
});
