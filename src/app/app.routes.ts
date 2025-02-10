import { Routes } from '@angular/router';
import { TaskDetailsComponent } from './components/task-details/task-details.component';
import { MainViewComponent } from './components/main-view/main-view.component';

export const routes: Routes = [
  { path: '', component: MainViewComponent },
  { path: 'tasks/:taskId/details', component: TaskDetailsComponent }
];
