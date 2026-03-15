import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { User } from '../../generated';
import { PasswordResetDialogComponent } from '../password-reset-dialog/password-reset-dialog.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTabsModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  isCreatingUser = false;
  isInitializingDb = false;
  isMigratingDb = false;
  isLoadingUsers = false;
  resettingPasswordIds = new Set<number>();

  users: User[] = [];
  displayedColumns = ['id', 'email', 'role', 'actions'];

  createUserForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    isAdmin: [false],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.adminService.listUsers().subscribe({
      next: users => {
        this.users = users;
        this.isLoadingUsers = false;
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Failed to load users', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
        this.isLoadingUsers = false;
      },
    });
  }

  createUser(): void {
    if (this.createUserForm.invalid || this.isCreatingUser) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.isCreatingUser = true;
    this.adminService
      .createUser({
        email: this.createUserForm.controls.email.value ?? '',
        password: this.createUserForm.controls.password.value ?? '',
        is_admin: this.createUserForm.controls.isAdmin.value ?? false,
      })
      .subscribe({
        next: user => {
          this.snackBar.open(
            `User created successfully: ${user?.email} (ID: ${user?.id})`,
            'Close',
            {
              duration: 5000,
              panelClass: ['success-snackbar'],
            }
          );
          this.createUserForm.reset({ isAdmin: false });
          this.isCreatingUser = false;
          this.loadUsers();
        },
        error: err => {
          this.snackBar.open(err.error?.detail || 'Failed to create user', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          this.isCreatingUser = false;
        },
      });
  }

  deleteUser(userId: number): void {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.adminService.deleteUser(userId).subscribe({
      next: user => {
        this.snackBar.open(`User ${user?.email} deleted successfully`, 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'],
        });
        this.loadUsers();
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Failed to delete user', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  resetPassword(userId: number): void {
    if (this.resettingPasswordIds.has(userId)) return;
    this.resettingPasswordIds.add(userId);

    this.adminService.resetUserPassword(userId).subscribe({
      next: response => {
        this.resettingPasswordIds.delete(userId);
        this.dialog.open(PasswordResetDialogComponent, {
          data: { email: response.email, newPassword: response.new_password },
          width: '420px',
          disableClose: true,
        });
      },
      error: err => {
        this.resettingPasswordIds.delete(userId);
        this.snackBar.open(err.error?.detail || 'Failed to reset password', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  toggleRole(user: User): void {
    this.adminService.updateUserRole(user.id, !user.is_admin).subscribe({
      next: updated => {
        this.snackBar.open(
          `${updated?.email} is now ${updated?.is_admin ? 'an admin' : 'a regular user'}`,
          'Close',
          { duration: 5000, panelClass: ['success-snackbar'] }
        );
        this.loadUsers();
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Failed to update role', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  initializeDatabase(): void {
    if (this.isInitializingDb) return;

    if (
      !confirm('Are you sure you want to initialize the database? This will create all tables.')
    ) {
      return;
    }

    this.isInitializingDb = true;
    this.adminService.initDatabase().subscribe({
      next: response => {
        this.snackBar.open(response?.message || 'Database initialized successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'],
        });
        this.isInitializingDb = false;
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Failed to initialize database', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
        this.isInitializingDb = false;
      },
    });
  }

  migrateDatabase(): void {
    if (this.isMigratingDb) return;

    if (!confirm('Are you sure you want to migrate the database?')) {
      return;
    }

    this.isMigratingDb = true;
    this.adminService.migrateDatabase().subscribe({
      next: response => {
        this.snackBar.open(response?.message || 'Database migrated successfully', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'],
        });
        this.isMigratingDb = false;
      },
      error: err => {
        this.snackBar.open(err.error?.detail || 'Failed to migrate database', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
        this.isMigratingDb = false;
      },
    });
  }

  goBack(): void {
    void this.router.navigate(['/']);
  }
}
