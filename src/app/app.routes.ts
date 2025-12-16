import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./components/login/login.module').then(m => m.LoginModule),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/user-profile/user-profile.component').then(
        m => m.UserProfileComponent
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard.component').then(
        m => m.AdminDashboardComponent
      ),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./components/main-view/main-view.module').then(m => m.MainViewModule),
  },
  {
    path: 'tasks/:taskId/details',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./components/task-details/task-details.module').then(m => m.TaskDetailsModule),
  },
];
