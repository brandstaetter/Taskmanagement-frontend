import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../services/task.service';
import { TaskService } from '../../services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-plan-it',
  standalone: true,
  imports: [
    CommonModule,
    TaskCardComponent
  ],
  templateUrl: './plan-it.component.html',
  styleUrls: ['./plan-it.component.scss']
})
export class PlanItComponent implements OnInit {
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];
  private readonly SOON_THRESHOLD_HOURS = 12;

  constructor(
    private taskService: TaskService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
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
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
      }
    });
  }

  onStartTask(task: Task): void {
    this.taskService.startTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error starting task:', error);
        this.snackBar.open('Error starting task', 'Close', { duration: 3000 });
      }
    });
  }

  onCompleteTask(task: Task): void {
    this.taskService.completeTask(task.id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error completing task:', error);
        this.snackBar.open('Error completing task', 'Close', { duration: 3000 });
      }
    });
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
}
