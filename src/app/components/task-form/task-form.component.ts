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
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Task, TaskService, TaskCreate, TaskUpdate } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { UserService, User } from '../../services/user.service';

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
    MatSelectModule,
    MatSlideToggleModule,
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
  availableUsers: User[] = [];
  private readonly MINUTES_INTERVAL = 30;
  private readonly END_OF_DAY_HOUR = 23;
  private readonly END_OF_DAY_MINUTE = 30;
  private _rawTimeInput = '';
  private _updatingDateTime = false;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private authService: AuthService,
    private userService: UserService,
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
    this.userService.getUsers().subscribe({
      next: users => {
        this.availableUsers = users;
      },
    });
  }

  assignToMe(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;
    const current: number[] = this.taskForm.get('assigned_user_ids')?.value ?? [];
    if (!current.includes(currentUser.id)) {
      this.taskForm.get('assigned_user_ids')?.setValue([...current, currentUser.id]);
    }
  }

  getUserDisplayName(user: User): string {
    return user.display_name ?? user.email ?? String(user.id);
  }

  private initForm(): void {
    let dueDate = null;
    let dueTime = null;

    if (this.task?.due_date) {
      const date = new Date(this.task.due_date);
      dueDate = date;
      dueTime = new Date(date);
    }

    const existingAssigneeIds = (this.task?.assigned_users_display ?? []).map(u => u.id);

    this.taskForm = this.fb.group({
      title: [this.task?.title || '', [Validators.required]],
      description: [this.task?.description || '', [Validators.required]],
      due_date: [dueDate],
      due_time: [dueTime],
      reward: [this.task?.reward || null],
      assigned_user_ids: [existingAssigneeIds],
      is_private: [(this.task as Task & { is_private?: boolean })?.is_private ?? false],
      anonymous: [false],
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

  storeRawTimeInput(event: Event): void {
    this._rawTimeInput = (event.target as HTMLInputElement).value;
  }

  private parseRawTime(raw: string): Date | null {
    const match = raw.match(/^(\d{1,2})(\d{2})$/);
    if (!match) return null;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h > 23 || m > 59) return null;
    const date = new Date();
    date.setHours(h, m, 0, 0);
    return date;
  }

  onTimeInputBlur(event: Event): void {
    const raw = (event.target as HTMLInputElement).value || this._rawTimeInput;
    this._rawTimeInput = '';
    const parsed = this.parseRawTime(raw);
    if (!parsed) return;
    this.taskForm.get('due_time')?.setValue(parsed);
  }

  onTimeInputEnter(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value || this._rawTimeInput;
    const parsed = this.parseRawTime(raw);
    if (parsed) {
      this._rawTimeInput = '';
      this.taskForm.get('due_time')?.setValue(parsed);
      // Format the display — MatTimepicker skips formatting while input has focus
      const hours = parsed.getHours().toString().padStart(2, '0');
      const minutes = parsed.getMinutes().toString().padStart(2, '0');
      input.value = `${hours}:${minutes}`;
    }
    (event as KeyboardEvent).preventDefault();
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
    if (this._updatingDateTime) return;
    this._updatingDateTime = true;

    const date = this.taskForm.get('due_date')?.value;
    const time = this.taskForm.get('due_time')?.value;

    if (
      date instanceof Date &&
      time instanceof Date &&
      !isNaN(date.getTime()) &&
      !isNaN(time.getTime())
    ) {
      const combinedDate = new Date(date);
      combinedDate.setHours(time.getHours());
      combinedDate.setMinutes(time.getMinutes());
      combinedDate.setSeconds(0);
      combinedDate.setMilliseconds(0);
      this.taskForm.get('due_date')?.setValue(combinedDate);
    }

    this._updatingDateTime = false;
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
        const currentPrivate = (this.task as Task & { is_private?: boolean })?.is_private ?? false;
        if (formValue['is_private'] !== currentPrivate) {
          (changes as Record<string, unknown>)['is_private'] = formValue['is_private'] || false;
        }
        // Always include assigned_user_ids in edit to allow clearing
        changes['assigned_user_ids'] = formValue['assigned_user_ids'] ?? [];
      }

      if (this.mode === 'create') {
        // For create, include all values
        const currentUser = this.authService.getCurrentUser();
        const taskData: TaskCreate & { is_private?: boolean; anonymous?: boolean } = {
          ...formValue,
          state: 'todo',
          due_date: formValue.due_date || undefined,
          reward: formValue.reward?.trim() || undefined,
          created_by: currentUser?.id || 0,
          assigned_user_ids: formValue.assigned_user_ids?.length
            ? formValue.assigned_user_ids
            : undefined,
          is_private: formValue.is_private || undefined,
          anonymous: formValue.anonymous || undefined,
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
