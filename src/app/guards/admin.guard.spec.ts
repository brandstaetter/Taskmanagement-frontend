import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

describe('adminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'isAdmin']);
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when user is authenticated and is admin', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('should redirect to home when user is not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);
    authService.isAdmin.and.returnValue(false);
    const urlTree = router.createUrlTree(['/']);
    router.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should redirect to home when user is authenticated but not admin', () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isAdmin.and.returnValue(false);
    const urlTree = router.createUrlTree(['/']);
    router.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
