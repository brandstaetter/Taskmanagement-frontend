import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-task-edit-dialog',
  standalone: true,
  imports: [CommonModule, TaskFormComponent],
  template: '<app-task-form></app-task-form>',
})
export class TaskEditDialogComponent {}
