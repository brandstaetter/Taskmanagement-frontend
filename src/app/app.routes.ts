import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./components/login/login.module').then(m => m.LoginModule),
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
