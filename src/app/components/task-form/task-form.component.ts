import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  Optional,
  Inject,
  OnInit,
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
import { Task, TaskService, TaskCreate, TaskUpdate } from '../../services/task.service';

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
export class TaskFormComponent implements OnInit {
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
  }

  ngOnInit(): void {
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
      reward: [this.task?.reward || null],
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

      // Combine date and time if both are present
      if (formValue.due_date) {
        const date = new Date(formValue.due_date);
        if (formValue.due_time) {
          const time = new Date(formValue.due_time);
          date.setHours(time.getHours());
          date.setMinutes(time.getMinutes());
        }
        formValue.due_date = date.toISOString();
      }

      // Clean up form value
      delete formValue.due_time;

      // Only include changed values in the update
      const changes: Partial<TaskUpdate> = {};
      if (this.mode === 'edit' && this.task) {
        // Compare form values with original task
        if (formValue['title'] !== this.task.title) {
          changes['title'] = formValue['title'];
        }
        if (formValue['description'] !== this.task.description) {
          changes['description'] = formValue['description'];
        }
        if (formValue['due_date'] !== this.task.due_date) {
          changes['due_date'] = formValue['due_date'] || undefined;
        }
        if (formValue['reward'] !== this.task.reward) {
          changes['reward'] = formValue['reward']?.trim() || undefined;
        }
      }

      if (this.mode === 'create') {
        // For create, include all values
        const taskData: TaskCreate = {
          ...formValue,
          state: 'todo',
          due_date: formValue.due_date || undefined,
          reward: formValue.reward?.trim() || undefined,
        };

        this.taskService.createTask(taskData).subscribe({
          next: task => {
            this.handleSuccess(task, 'Task added successfully');
          },
          error: () => {
            this.handleError('Error adding task');
          },
        });
      } else {
        // For update, only send changed values
        if (Object.keys(changes).length > 0) {
          this.taskService.updateTask(this.task!.id, changes as TaskUpdate).subscribe({
            next: task => {
              this.handleSuccess(task, 'Task updated successfully');
            },
            error: () => {
              this.handleError('Error updating task');
            },
          });
        } else {
          // No changes, just close
          this.handleSuccess(this.task!, 'No changes made');
        }
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

  private handleSuccess(task: Task, message: string): void {
    if (this.dialogRef) {
      this.dialogRef.close(task);
    } else {
      this.save.emit(task);
    }
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private handleError(message: string): void {
    console.error(message);
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
