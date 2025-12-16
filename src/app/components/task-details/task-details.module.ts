import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaskDetailsComponent } from './task-details.component';

const routes: Routes = [{ path: '', component: TaskDetailsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TaskDetailsModule {}
