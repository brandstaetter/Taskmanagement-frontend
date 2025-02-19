import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatMenuModule,
        MatButtonModule,
        MatChipsModule,
        MatTooltipModule,
        TaskCardComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;

    // Set up a default task
    component.task = {
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      state: 'todo',
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Menu visibility', () => {
    it('should show menu button when showActions is true', () => {
      component.showActions = true;
      fixture.detectChanges();
      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      expect(menuButton).toBeTruthy();
    });

    it('should hide menu button when showActions is false', () => {
      component.showActions = false;
      fixture.detectChanges();
      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      expect(menuButton).toBeFalsy();
    });
  });

  describe('Menu options', () => {
    it('should show "Reopen Task" option when task is not in todo state', fakeAsync(() => {
      component.task.state = 'done';
      fixture.detectChanges();

      // Open the menu
      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      menuButton.nativeElement.click();
      fixture.detectChanges();
      tick();

      const reopenButton = document.querySelector('button[mat-menu-item] span');
      expect(reopenButton?.textContent).toContain('Reopen Task');
    }));

    it('should show "Archive Task" option when task is in todo state', fakeAsync(() => {
      component.task.state = 'todo';
      fixture.detectChanges();

      // Open the menu
      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      menuButton.nativeElement.click();
      fixture.detectChanges();
      tick();

      const archiveButton = document.querySelector('button[mat-menu-item] span');
      expect(archiveButton?.textContent).toContain('Archive Task');
    }));

    it('should emit reopenTask event when reopen button is clicked', fakeAsync(() => {
      spyOn(component.reopenTask, 'emit');
      component.task.state = 'done';
      fixture.detectChanges();

      // Open the menu
      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      menuButton.nativeElement.click();
      fixture.detectChanges();
      tick();

      const reopenButton = document.querySelector('button[mat-menu-item]') as HTMLElement;
      reopenButton?.click();
      fixture.detectChanges();
      tick();

      expect(component.reopenTask.emit).toHaveBeenCalledWith(component.task);
    }));

    it('should emit archiveTask event when archive button is clicked', fakeAsync(() => {
      spyOn(component.archiveTask, 'emit');
      component.task.state = 'todo';
      fixture.detectChanges();

      // Open the menu
      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      menuButton.nativeElement.click();
      fixture.detectChanges();
      tick();

      const archiveButton = document.querySelector('button[mat-menu-item]') as HTMLElement;
      archiveButton?.click();
      fixture.detectChanges();
      tick();

      expect(component.archiveTask.emit).toHaveBeenCalledWith(component.task);
    }));
  });

  describe('Overdue warning', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2025-02-19T00:00:00Z'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should show warning icon for overdue todo tasks', () => {
      component.task.state = 'todo';
      component.task.due_date = '2025-02-18T00:00:00Z';
      fixture.detectChanges();
      const warningIcon = fixture.debugElement.query(By.css('.warning-icon'));
      expect(warningIcon).toBeTruthy();
    });

    it('should not show warning icon for overdue done tasks', () => {
      component.task.state = 'done';
      component.task.due_date = '2025-02-18T00:00:00Z';
      fixture.detectChanges();
      const warningIcon = fixture.debugElement.query(By.css('.warning-icon'));
      expect(warningIcon).toBeFalsy();
    });

    it('should not show warning icon for overdue archived tasks', () => {
      component.task.state = 'archived';
      component.task.due_date = '2025-02-18T00:00:00Z';
      fixture.detectChanges();
      const warningIcon = fixture.debugElement.query(By.css('.warning-icon'));
      expect(warningIcon).toBeFalsy();
    });

    it('should not show warning icon for non-overdue tasks', () => {
      component.task.state = 'todo';
      component.task.due_date = '2025-02-20T00:00:00Z';
      fixture.detectChanges();
      const warningIcon = fixture.debugElement.query(By.css('.warning-icon'));
      expect(warningIcon).toBeFalsy();
    });
  });
});
