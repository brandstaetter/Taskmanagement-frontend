import { Component, inject } from '@angular/core';
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
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';

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
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isCreatingUser = false;
  isResettingPassword = false;
  isInitializingDb = false;
  isMigratingDb = false;

  createUserForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    isAdmin: [false],
  });

  resetPasswordForm = this.fb.group({
    userId: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

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
          this.snackBar.open(`User created successfully: ${user.email} (ID: ${user.id})`, 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar'],
          });
          this.createUserForm.reset({ isAdmin: false });
          this.isCreatingUser = false;
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

  resetPassword(): void {
    if (this.resetPasswordForm.invalid || this.isResettingPassword) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isResettingPassword = true;
    const userId = parseInt(this.resetPasswordForm.controls.userId.value ?? '', 10);

    this.adminService
      .resetUserPassword(userId, {
        new_password: this.resetPasswordForm.controls.newPassword.value ?? '',
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Password reset successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.resetPasswordForm.reset();
          this.isResettingPassword = false;
        },
        error: err => {
          this.snackBar.open(err.error?.detail || 'Failed to reset password', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          this.isResettingPassword = false;
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
        this.snackBar.open(response.message || 'Database initialized successfully', 'Close', {
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
        this.snackBar.open(response.message || 'Database migrated successfully', 'Close', {
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
