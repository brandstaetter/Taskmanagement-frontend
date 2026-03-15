import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ConfirmDialogComponent>>;

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'Test Title', message: 'Test message' },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title and message from data', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Test Title');
    expect(el.textContent).toContain('Test message');
  });

  it('should close with true when confirm() is called', () => {
    component.confirm();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close with false when cancel() is called', () => {
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should use default button labels when not provided', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Cancel');
    expect(el.textContent).toContain('Confirm');
  });

  it('should use custom button labels when provided', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { title: 'T', message: 'M', confirmLabel: 'Yes', cancelLabel: 'No' },
        },
      ],
    }).compileComponents();

    const f = TestBed.createComponent(ConfirmDialogComponent);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Yes');
    expect(el.textContent).toContain('No');
  });
});
