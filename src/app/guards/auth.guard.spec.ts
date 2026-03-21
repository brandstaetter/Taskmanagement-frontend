import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jest.Mocked<AuthService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    // Create spy objects for dependencies
    const authServiceSpy = { isAuthenticated: jest.fn() } as unknown as jest.Mocked<AuthService>;
    const routerSpy = { createUrlTree: jest.fn() } as unknown as jest.Mocked<Router>;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    authService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  it('should allow access when user is authenticated', () => {
    // Arrange
    authService.isAuthenticated.mockReturnValue(true);
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/protected-route' } as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    // Assert
    expect(result).toBe(true);
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    // Arrange
    authService.isAuthenticated.mockReturnValue(false);
    const mockUrlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(mockUrlTree);
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/protected-route' } as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    // Assert
    expect(result).toBe(mockUrlTree);
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/protected-route' },
    });
  });

  it('should include returnUrl query parameter when redirecting to login', () => {
    // Arrange
    authService.isAuthenticated.mockReturnValue(false);
    const mockUrlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(mockUrlTree);
    const mockRoute = {} as ActivatedRouteSnapshot;
    const targetUrl = '/task-details/123';
    const mockState = { url: targetUrl } as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    // Assert
    expect(result).toBe(mockUrlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: targetUrl },
    });
  });

  it('should handle root path correctly when not authenticated', () => {
    // Arrange
    authService.isAuthenticated.mockReturnValue(false);
    const mockUrlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(mockUrlTree);
    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/' } as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    // Assert
    expect(result).toBe(mockUrlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/' },
    });
  });

  it('should handle complex URLs with query parameters when not authenticated', () => {
    // Arrange
    authService.isAuthenticated.mockReturnValue(false);
    const mockUrlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(mockUrlTree);
    const mockRoute = {} as ActivatedRouteSnapshot;
    const complexUrl = '/task-details/123?view=expanded&tab=comments';
    const mockState = { url: complexUrl } as RouterStateSnapshot;

    // Act
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    // Assert
    expect(result).toBe(mockUrlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: complexUrl },
    });
  });
});
