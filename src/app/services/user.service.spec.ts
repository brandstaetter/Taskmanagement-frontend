import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/v1`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
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

  it('should update password', () => {
    const passwordUpdate = { current_password: 'old123', new_password: 'new123' };

    service.updatePassword(passwordUpdate).subscribe(response => {
      expect(response).toBeUndefined();
    });

    const req = httpMock.expectOne(`${apiUrl}/users/me/password`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(passwordUpdate);
    req.flush(null);
  });

  it('should update avatar', () => {
    const avatarUpdate = { avatar_url: 'https://example.com/avatar.jpg' };
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      is_active: true,
      is_admin: false,
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    service.updateAvatar(avatarUpdate).subscribe(user => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne(`${apiUrl}/users/me/avatar`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(avatarUpdate);
    req.flush(mockUser);
  });
});
