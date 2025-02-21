import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  Optional,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task, TaskService, TaskCreate } from '../../services/task.service';

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
    MatTimepickerModule,
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskFormComponent {
  @Input() task?: Task;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() save = new EventEmitter<Task>();
  @Output() cancelled = new EventEmitter<void>();

  taskForm!: FormGroup;
  private readonly MINUTES_INTERVAL = 30;
  private readonly END_OF_DAY_HOUR = 23;
  private readonly END_OF_DAY_MINUTE = 30;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private snackBar: MatSnackBar,
    @Optional() private dialogRef?: MatDialogRef<TaskFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private dialogData?: Task
  ) {
    // If used in a dialog without explicit inputs, use dialog data
    if (dialogData) {
      this.task = dialogData;
      this.mode = 'edit';
    }
    this.initForm();
  }

  private initForm(): void {
    let dueDate = null;
    let dueTime = null;

    if (this.task?.due_date) {
      const date = new Date(this.task.due_date);
      dueDate = date;
      dueTime = this.roundUpToNextInterval(date);
    }

    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required]],
      description: [this.task?.description || '', [Validators.required]],
      due_date: [dueDate],
      due_time: [dueTime],
      reward: [this.task?.reward || ''],
    });

    // Update time when date changes if time is already set
    this.taskForm.get('due_date')?.valueChanges.subscribe(() => {
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
    const minutesToAdd = this.MINUTES_INTERVAL - (minutes % this.MINUTES_INTERVAL);
    const roundedDate = new Date(date);

    roundedDate.setMinutes(minutes + minutesToAdd);

    if (
      minutesToAdd === this.MINUTES_INTERVAL &&
      (date.getSeconds() > 0 || date.getMilliseconds() > 0)
    ) {
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

      const dateControl = this.taskForm.get('due_date');
      if (!dateControl?.value) {
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
      this.taskForm.get('due_date')?.setValue(combinedDate, { emitEvent: false });
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

      if (this.mode === 'create') {
        const taskData: TaskCreate = {
          ...formValue,
          state: 'todo',
        };

        this.taskService.createTask(taskData).subscribe({
          next: (task: Task) => {
            if (this.dialogRef) {
              this.dialogRef.close(task);
            } else {
              this.save.emit(task);
            }
            this.snackBar.open('Task added successfully', 'Close', { duration: 3000 });
          },
          error: error => {
            console.error('Error adding task:', error);
            this.snackBar.open('Error adding task', 'Close', { duration: 3000 });
          },
        });
      } else {
        if (!this.task) return;

        this.taskService.updateTask(this.task.id, formValue).subscribe({
          next: (task: Task) => {
            if (this.dialogRef) {
              this.dialogRef.close(task);
            } else {
              this.save.emit(task);
            }
            this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
          },
          error: error => {
            console.error('Error updating task:', error);
            this.snackBar.open('Error updating task', 'Close', { duration: 3000 });
          },
        });
      }
    }
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.cancelled.emit();
    }
  }
}
