import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../services/task.service';
import { TaskService } from '../../services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskCardComponent } from '../task-card/task-card.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-plan-it',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './plan-it.component.html',
  styleUrls: ['./plan-it.component.scss'],
})
export class PlanItComponent implements OnInit {
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];
  archivedTasks: Task[] = [];
  showArchived = false;
  private readonly SOON_THRESHOLD_HOURS = 12;

  constructor(
    private taskService: TaskService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks(0, 100, this.showArchived).subscribe({
      next: tasks => {
        // Sort tasks by due date (null dates go to the end)
        const sortedTasks = tasks.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });

        // Filter tasks by state
        this.todoTasks = sortedTasks.filter(task => task.state === 'todo');
        this.inProgressTasks = sortedTasks.filter(task => task.state === 'in_progress');
        this.doneTasks = sortedTasks.filter(task => task.state === 'done');
        this.archivedTasks = sortedTasks.filter(task => task.state === 'archived');
      },
      error: error => {
        // Only show error toast if it's not a 404 (no tasks found)
        if (error.status !== 404) {
          console.error('Error loading tasks:', error);
          this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
        }
        // Initialize empty arrays for all task lists
        this.todoTasks = [];
        this.inProgressTasks = [];
        this.doneTasks = [];
        this.archivedTasks = [];
      },
    });
  }

  onStartTask(task: Task): void {
    this.taskService.startTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: error => {
        console.error('Error starting task:', error);
        this.snackBar.open('Error starting task', 'Close', { duration: 3000 });
      },
    });
  }

  onCompleteTask(task: Task): void {
    this.taskService.completeTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: error => {
        console.error('Error completing task:', error);
        this.snackBar.open('Error completing task', 'Close', { duration: 3000 });
      },
    });
  }

  onArchiveTask(task: Task): void {
    this.taskService.archiveTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
        this.snackBar.open('Task archived successfully', 'Close', { duration: 3000 });
      },
      error: error => {
        console.error('Error archiving task:', error);
        this.snackBar.open('Error archiving task', 'Close', { duration: 3000 });
      },
    });
  }

  onPrintTask(task: Task): void {
    this.taskService.printTask(task.id).subscribe({
      next: response => {
        // Create a blob URL and open it in a new window
        const blob = new Blob([response as Blob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url);
        this.snackBar.open('Task printed successfully', 'Close', { duration: 3000 });
      },
      error: error => {
        console.error('Error printing task:', error);
        this.snackBar.open('Error printing task', 'Close', { duration: 3000 });
      },
    });
  }

  onReopenTask(task: Task): void {
    this.taskService.updateTaskState(task.id, 'todo').subscribe(() => {
      this.loadTasks();
    });
  }

  toggleArchivedTasks(): void {
    this.showArchived = !this.showArchived;
    this.loadTasks();
  }

  formatDueDate(date: string | null | undefined): string {
    if (!date) return 'No date';
    return new Date(date).toLocaleString();
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

  getTaskClass(task: Task): string {
    if (this.isOverdue(task)) return 'overdue';
    if (this.isDueSoon(task)) return 'due-soon';
    return '';
  }

  hasAnyTasks(): boolean {
    return (
      this.todoTasks.length > 0 ||
      this.inProgressTasks.length > 0 ||
      this.doneTasks.length > 0 ||
      (this.showArchived && this.archivedTasks.length > 0)
    );
  }
}
