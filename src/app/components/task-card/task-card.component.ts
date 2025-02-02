import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../services/task.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() mode: 'default' | 'print-only' = 'default';
  @Input() showActions = true;
  @Input() showPrintButton = false;
  @Output() startTask = new EventEmitter<Task>();
  @Output() completeTask = new EventEmitter<Task>();
  @Output() printTask = new EventEmitter<Task>();

  private readonly SOON_THRESHOLD_HOURS = 12;

  formatDate(date: string | null | undefined): string {
    if (!date) return 'No date';
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimespan(date: string | null | undefined): string {
    if (!date) return '';
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = targetDate.getTime() - now.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs > 0) {
      // Future date
      if (diffDays > 0) return `in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
      if (diffHours > 0) return `in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
      if (diffMins > 0) return `in ${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'}`;
      return 'in less than a minute';
    } else {
      // Past date
      const absDiffDays = Math.abs(diffDays);
      const absDiffHours = Math.abs(diffHours);
      const absDiffMins = Math.abs(diffMins);

      if (absDiffDays > 0) return `${absDiffDays} ${absDiffDays === 1 ? 'day' : 'days'} ago`;
      if (absDiffHours > 0) return `${absDiffHours} ${absDiffHours === 1 ? 'hour' : 'hours'} ago`;
      if (absDiffMins > 0) return `${absDiffMins} ${absDiffMins === 1 ? 'minute' : 'minutes'} ago`;
      return 'just now';
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    return dueDate < new Date();
  }

  isDueSoon(task: Task): boolean {
    if (!task.due_date || this.isOverdue(task)) return false;
    const dueDate = new Date(task.due_date);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue <= this.SOON_THRESHOLD_HOURS;
  }

  getTaskClass(): string {
    if (this.isOverdue(this.task)) return 'overdue';
    if (this.isDueSoon(this.task)) return 'due-soon';
    return '';
  }
}
