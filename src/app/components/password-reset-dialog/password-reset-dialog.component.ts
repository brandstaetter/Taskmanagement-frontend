import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface PasswordResetDialogData {
  email: string;
  newPassword: string;
}

@Component({
  selector: 'app-password-reset-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './password-reset-dialog.component.html',
  styleUrls: ['./password-reset-dialog.component.scss'],
})
export class PasswordResetDialogComponent {
  data: PasswordResetDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PasswordResetDialogComponent>);
  private snackBar = inject(MatSnackBar);

  copyToClipboard(): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(this.data.newPassword)
        .then(() => {
          this.snackBar.open('Password copied to clipboard', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
        })
        .catch(() => {
          this.snackBar.open('Failed to copy — please copy manually', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        });
    } else {
      this.snackBar.open('Clipboard not available — please copy manually', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
