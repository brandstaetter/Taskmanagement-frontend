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
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-profile',
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
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  user: User | null = null;
  isLoadingPassword = false;
  isLoadingAvatar = false;

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  avatarForm = this.fb.group({
    avatarUrl: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user?.avatar_url) {
      this.avatarForm.patchValue({ avatarUrl: this.user.avatar_url });
    }
  }

  updatePassword(): void {
    if (this.passwordForm.invalid || this.isLoadingPassword) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const newPassword = this.passwordForm.controls.newPassword.value ?? '';
    const confirmPassword = this.passwordForm.controls.confirmPassword.value ?? '';

    if (newPassword !== confirmPassword) {
      this.snackBar.open('New passwords do not match', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.isLoadingPassword = true;
    this.userService
      .updatePassword({
        current_password: this.passwordForm.controls.currentPassword.value ?? '',
        new_password: newPassword,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Password updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.passwordForm.reset();
          this.isLoadingPassword = false;
        },
        error: err => {
          this.snackBar.open(
            err.error?.detail ||
              'Failed to update password. Please check your current password and try again.',
            'Close',
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
            }
          );
          this.isLoadingPassword = false;
        },
      });
  }

  updateAvatar(): void {
    if (this.avatarForm.invalid || this.isLoadingAvatar) {
      this.avatarForm.markAllAsTouched();
      return;
    }

    this.isLoadingAvatar = true;
    this.userService
      .updateAvatar({
        avatar_url: this.avatarForm.controls.avatarUrl.value ?? '',
      })
      .subscribe({
        next: user => {
          this.user = user;
          this.snackBar.open('Avatar updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.isLoadingAvatar = false;
        },
        error: err => {
          this.snackBar.open(err.error?.detail || 'Failed to update avatar', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
          this.isLoadingAvatar = false;
        },
      });
  }

  goBack(): void {
    void this.router.navigate(['/']);
  }
}
