import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, switchMap } from 'rxjs';
import { Task, TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss'],
})
export class TaskDetailsComponent implements OnInit {
  private refreshSubject = new BehaviorSubject<void>(undefined);
  task$: Observable<Task>;
  private readonly SOON_THRESHOLD_HOURS = 12;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService
  ) {
    const taskId = this.route.snapshot.paramMap.get('taskId');
    this.task$ = this.refreshSubject.pipe(
      switchMap(() => this.taskService.getTask(Number(taskId)))
    );
  }

  ngOnInit(): void {
    this.refreshTask();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  reopenTask(task: Task): void {
    this.taskService.updateTaskState(task.id, 'todo').subscribe({
      next: () => this.refreshTask(),
      error: error => console.error('Error reopening task:', error),
    });
  }

  startTask(task: Task): void {
    this.taskService.updateTaskState(task.id, 'in_progress').subscribe({
      next: () => this.refreshTask(),
      error: error => console.error('Error starting task:', error),
    });
  }

  completeTask(task: Task): void {
    this.taskService.updateTaskState(task.id, 'done').subscribe({
      next: () => this.refreshTask(),
      error: error => console.error('Error completing task:', error),
    });
  }

  private refreshTask(): void {
    this.refreshSubject.next(undefined);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';
    const taskDate = new Date(date);
    return taskDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  getTimespan(date: string | null | undefined): string {
    if (!date) return '';
    const taskDate = new Date(date);
    const now = new Date();
    const diffHours = (taskDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays < 0) {
      return this.getTimeString(Math.abs(diffDays), 'day') + ' ago';
    } else if (diffDays === 0) {
      const hours = Math.ceil(diffHours);
      if (hours <= 0) {
        return 'now';
      }
      return 'in ' + this.getTimeString(hours, 'hour');
    }
    return 'in ' + this.getTimeString(diffDays, 'day');
  }

  private getTimeString(value: number, unit: string): string {
    return `${value} ${unit}${value !== 1 ? 's' : ''}`;
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

  getTaskClasses(task: Task): Record<string, boolean> {
    return {
      'task-card': true,
      todo: task.state === 'todo',
      in_progress: task.state === 'in_progress',
      done: task.state === 'done',
      archived: task.state === 'archived',
      overdue: this.isOverdue(task),
      'due-soon': this.isDueSoon(task),
    };
  }

  getActionButtonText(task: Task): string {
    switch (task.state) {
      case 'todo':
        return 'START';
      case 'in_progress':
        return 'COMPLETE';
      default:
        return '';
    }
  }

  onActionButtonClick(task: Task): void {
    switch (task.state) {
      case 'todo':
        this.startTask(task);
        break;
      case 'in_progress':
        this.completeTask(task);
        break;
    }
  }
}
