import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-task-edit-dialog',
  standalone: true,
  imports: [CommonModule, TaskFormComponent],
  templateUrl: './task-edit-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./task-edit-dialog.component.scss'],
})
export class TaskEditDialogComponent {}
