import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./components/main-view/main-view.module')
      .then(m => m.MainViewModule)
  },
  {
    path: 'tasks/:taskId/details',
    loadChildren: () => import('./components/task-details/task-details.module')
      .then(m => m.TaskDetailsModule)
  }
];
