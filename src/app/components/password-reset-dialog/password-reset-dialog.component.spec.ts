import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  PasswordResetDialogComponent,
  PasswordResetDialogData,
} from './password-reset-dialog.component';

const mockData: PasswordResetDialogData = {
  email: 'user@example.com',
  newPassword: 'SecurePass123!',
};

describe('PasswordResetDialogComponent', () => {
  let component: PasswordResetDialogComponent;
  let fixture: ComponentFixture<PasswordResetDialogComponent>;
  let dialogRef: jest.Mocked<MatDialogRef<PasswordResetDialogComponent>>;

  beforeEach(async () => {
    dialogRef = { close: jest.fn() } as unknown as jest.Mocked<
      MatDialogRef<PasswordResetDialogComponent>
    >;

    await TestBed.configureTestingModule({
      imports: [PasswordResetDialogComponent, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordResetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the email and password from dialog data', () => {
    expect(component.data.email).toBe('user@example.com');
    expect(component.data.newPassword).toBe('SecurePass123!');
  });

  it('should close the dialog when close() is called', () => {
    component.close();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should show snackbar when clipboard API is unavailable', () => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    jest.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined as unknown as Clipboard);

    component.copyToClipboard();

    expect(snackBarSpy).toHaveBeenCalledWith(
      'Clipboard not available — please copy manually',
      'Close',
      { duration: 3000, panelClass: ['error-snackbar'] }
    );
  });

  it('should copy password to clipboard and show success snackbar', async () => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    const mockClipboard = {
      writeText: jest.fn().mockReturnValue(Promise.resolve()),
      read: jest.fn(),
      readText: jest.fn(),
      write: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as unknown as Clipboard;
    jest.spyOn(navigator, 'clipboard', 'get').mockReturnValue(mockClipboard);

    component.copyToClipboard();
    await fixture.whenStable();

    expect(mockClipboard.writeText).toHaveBeenCalledWith('SecurePass123!');
    expect(snackBarSpy).toHaveBeenCalledWith('Password copied to clipboard', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  });

  it('should show error snackbar when clipboard write fails', async () => {
    const snackBarSpy = jest.spyOn(component['snackBar'], 'open');
    const mockClipboard = {
      writeText: jest.fn().mockReturnValue(Promise.reject(new Error('denied'))),
      read: jest.fn(),
      readText: jest.fn(),
      write: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    } as unknown as Clipboard;
    jest.spyOn(navigator, 'clipboard', 'get').mockReturnValue(mockClipboard);

    component.copyToClipboard();
    await fixture.whenStable();

    expect(snackBarSpy).toHaveBeenCalledWith('Failed to copy — please copy manually', 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar'],
    });
  });
});
