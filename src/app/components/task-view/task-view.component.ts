import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../services/task.service';
import { TaskService } from '../../services/task.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-task-view',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TaskCardComponent
  ],
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss']
})
export class TaskViewComponent implements OnInit {
  dueTasks: Task[] = [];
  isLoadingRandom = false;
  showArchived = false;

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadDueTasks();
  }

  loadDueTasks(): void {
    this.taskService.getDueTasks().subscribe(tasks => {
      // Filter tasks based on archived state
      this.dueTasks = tasks.filter(task => {
        if (this.showArchived) {
          return true; // Show all tasks when showArchived is true
        }
        return task.state !== 'archived' && task.state !== 'done';
      });
    });
  }

  toggleArchivedTasks(): void {
    this.showArchived = !this.showArchived;
    this.loadDueTasks();
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
    return hoursUntilDue <= 12;
  }

  onStartTask(task: Task): void {
    this.taskService.startTask(task.id).subscribe(() => {
      this.loadDueTasks();
    });
  }

  onCompleteTask(task: Task): void {
    this.taskService.completeTask(task.id).subscribe(() => {
      this.loadDueTasks();
    });
  }

  onArchiveTask(task: Task): void {
    this.taskService.archiveTask(task.id).subscribe(() => {
      this.loadDueTasks();
    });
  }

  onPrintTask(task: Task): void {
    this.taskService.printTask(task.id).subscribe({
      next: (response: Blob | Record<string, unknown>) => {
        if (response instanceof Blob) {
          // It's a PDF, create a download
          const blob = new Blob([response], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `task-${task.id}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        } else {
          // Handle non-PDF response (e.g., when using a physical printer)
          console.log('Task sent to printer');
        }

        // After successful print, start the task if it's in todo state
        if (task.state === 'todo') {
          this.taskService.startTask(task.id).subscribe({
            next: () => {
              this.loadDueTasks();
            }
          });
        }
      },
      error: (error) => console.error('Error printing task:', error)
    });
  }

  onPrintRandomTask(): void {
    if (this.isLoadingRandom) return;
    
    this.isLoadingRandom = true;
    this.taskService.getRandomTask().subscribe({
      next: (task) => this.onPrintTask(task),
      error: (error) => console.error('Error getting random task:', error),
      complete: () => this.isLoadingRandom = false
    });
  }
}
