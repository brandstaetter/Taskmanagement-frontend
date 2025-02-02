import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { TaskService, Task, TaskCreate } from '../../services/task.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' } // This sets Monday as first day of week
  ],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskFormComponent {
  taskForm: FormGroup;
  private readonly MINUTES_INTERVAL = 30; // Match timepicker's 30-minute intervals
  private readonly END_OF_DAY_HOUR = 23;
  private readonly END_OF_DAY_MINUTE = 30;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskFormComponent>,
    private taskService: TaskService,
    private snackBar: MatSnackBar
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      due_date: [null],
      due_time: [null],
      reward: ['']
    });

    // Update time when date changes if time is already set
    this.taskForm.get('due_date')?.valueChanges.subscribe(date => {
      const timeControl = this.taskForm.get('due_time');
      if (timeControl?.value) {
        this.updateDateTime();
      }
    });

    // Update date when time changes if date is already set
    this.taskForm.get('due_time')?.valueChanges.subscribe(time => {
      if (time) {
        this.updateDateTime();
      }
    });
  }

  private roundUpToNextInterval(date: Date): Date {
    const minutes = date.getMinutes();
    // Calculate how many minutes to add to reach the next interval
    const minutesToAdd = this.MINUTES_INTERVAL - (minutes % this.MINUTES_INTERVAL);
    const roundedDate = new Date(date);
    
    // Add the minutes
    roundedDate.setMinutes(minutes + minutesToAdd);
    
    // If we're already at an exact interval and have seconds/milliseconds,
    // bump to the next interval
    if (minutesToAdd === this.MINUTES_INTERVAL && 
        (date.getSeconds() > 0 || date.getMilliseconds() > 0)) {
      roundedDate.setMinutes(minutes + this.MINUTES_INTERVAL);
    }
    
    roundedDate.setSeconds(0);
    roundedDate.setMilliseconds(0);
    
    return roundedDate;
  }

  prefillCurrentTime(): void {
    const timeControl = this.taskForm.get('due_time');
    if (!timeControl?.value) {
      const now = new Date();
      const roundedTime = this.roundUpToNextInterval(now);
      timeControl?.setValue(roundedTime);
      
      // If date is not set, also set it to today
      const dateControl = this.taskForm.get('due_date');
      if (!dateControl?.value) {
        // If rounding up pushed us to the next day, use that date
        dateControl?.setValue(roundedTime);
      }
    }
  }

  prefillEndOfDay(): void {
    const dateControl = this.taskForm.get('due_date');
    const timeControl = this.taskForm.get('due_time');
    
    if (!dateControl?.value) {
      const today = new Date();
      today.setHours(this.END_OF_DAY_HOUR);
      today.setMinutes(this.END_OF_DAY_MINUTE);
      today.setSeconds(0);
      today.setMilliseconds(0);
      
      dateControl?.setValue(today);
      
      // Only set the time if it wasn't set before
      if (!timeControl?.value) {
        timeControl?.setValue(today);
      }
    }
  }

  updateDateTime(): void {
    const date = this.taskForm.get('due_date')?.value;
    const time = this.taskForm.get('due_time')?.value;
    
    if (date && time) {
      const combinedDate = new Date(date);
      combinedDate.setHours(time.getHours());
      combinedDate.setMinutes(time.getMinutes());
      combinedDate.setSeconds(0);
      combinedDate.setMilliseconds(0);
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      
      // Combine date and time into a single date field
      if (formValue.due_date) {
        const date = new Date(formValue.due_date);
        if (formValue.due_time) {
          const time = new Date(formValue.due_time);
          date.setHours(time.getHours());
          date.setMinutes(time.getMinutes());
        }
        formValue.due_date = date.toISOString();
      }
      delete formValue.due_time;

      // Create task data object that matches TaskCreate interface
      const taskData: TaskCreate = {
        title: formValue.title,
        description: formValue.description,
        state: 'todo',
        due_date: formValue.due_date,
        reward: formValue.reward
      };
      
      this.taskService.createTask(taskData).subscribe({
        next: (task: Task) => {
          this.dialogRef.close(task);
          this.snackBar.open('Task added successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error adding task:', error);
          this.snackBar.open('Error adding task', 'Close', { duration: 3000 });
          // Keep the dialog open on error
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
