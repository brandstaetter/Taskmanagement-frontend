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
    MatChipsModule,
  ],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Input() mode: 'default' | 'print-only' = 'default';
  @Input() showActions = true;
  @Input() showPrintButton = false;
  @Output() startTask = new EventEmitter<Task>();
  @Output() completeTask = new EventEmitter<Task>();
  @Output() printTask = new EventEmitter<Task>();
  @Output() archiveTask = new EventEmitter<Task>();

  private readonly SOON_THRESHOLD_HOURS = 12;

  formatDate(date: string | null | undefined): string {
    if (!date) return 'No date';
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getTimespan(date: string | null | undefined): string {
    if (!date) return '';
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = targetDate.getTime() - now.getTime();

    // Convert to absolute values for calculations
    const absDiffMs = Math.abs(diffMs);
    const absDiffSecs = Math.floor(absDiffMs / 1000);
    const absDiffMins = Math.floor(absDiffSecs / 60);
    const absDiffHours = Math.floor(absDiffMins / 60);
    const absDiffDays = Math.floor(absDiffHours / 24);

    // Calculate remaining minutes and hours after subtracting days
    const remainingHours = absDiffHours % 24;
    const remainingMins = absDiffMins % 60;

    // Helper function to create the time string
    const getTimeString = (value: number, unit: string): string => {
      return `${value} ${unit}${value !== 1 ? 's' : ''}`;
    };

    if (diffMs > 0) {
      // Future date
      if (absDiffDays > 0) {
        if (remainingHours > 0) {
          return `in ${getTimeString(absDiffDays, 'day')} and ${getTimeString(remainingHours, 'hour')}`;
        }
        return `in ${getTimeString(absDiffDays, 'day')}`;
      }
      if (absDiffHours > 0) {
        if (remainingMins > 0) {
          return `in ${getTimeString(absDiffHours, 'hour')} and ${getTimeString(remainingMins, 'minute')}`;
        }
        return `in ${getTimeString(absDiffHours, 'hour')}`;
      }
      if (absDiffMins > 0) {
        return `in ${getTimeString(absDiffMins, 'minute')}`;
      }
      return 'in less than a minute';
    } else {
      // Past date
      if (absDiffDays > 0) {
        if (remainingHours > 0) {
          return `${getTimeString(absDiffDays, 'day')} and ${getTimeString(remainingHours, 'hour')} ago`;
        }
        return `${getTimeString(absDiffDays, 'day')} ago`;
      }
      if (absDiffHours > 0) {
        if (remainingMins > 0) {
          return `${getTimeString(absDiffHours, 'hour')} and ${getTimeString(remainingMins, 'minute')} ago`;
        }
        return `${getTimeString(absDiffHours, 'hour')} ago`;
      }
      if (absDiffMins > 0) {
        return `${getTimeString(absDiffMins, 'minute')} ago`;
      }
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
    if (this.task.state === 'archived') {
      return 'archived-task';
    }
    if (this.isOverdue(this.task)) return 'overdue';
    if (this.isDueSoon(this.task)) return 'due-soon';
    return '';
  }
}
