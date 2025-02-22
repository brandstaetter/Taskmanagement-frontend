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
    component.showActions = true;
    component.mode = 'default';

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

      const menuItems = document.querySelectorAll('button[mat-menu-item] span');
      const reopenButton = Array.from(menuItems).find(item =>
        item.textContent?.includes('Reopen Task')
      );
      expect(reopenButton).toBeTruthy();
      expect(reopenButton?.textContent).toContain('Reopen Task');
    }));

    it('should show both "Edit Task" and "Archive Task" options when task is in todo state', fakeAsync(() => {
      component.task.state = 'todo';
      fixture.detectChanges();

      // Open the menu
      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      menuButton.nativeElement.click();
      fixture.detectChanges();
      tick();

      const menuItems = document.querySelectorAll('button[mat-menu-item] span');
      const menuTexts = Array.from(menuItems).map(item => item.textContent?.trim());

      expect(menuTexts).toContain('Edit Task');
      expect(menuTexts).toContain('Archive Task');
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

      // Find the reopen button by its text content
      const menuItems = document.querySelectorAll('button[mat-menu-item]');
      const reopenButton = Array.from(menuItems).find(item =>
        item.textContent?.includes('Reopen Task')
      ) as HTMLElement;

      expect(reopenButton).toBeTruthy('Reopen Task button should be present');
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

      const menuItems = document.querySelectorAll('button[mat-menu-item]');
      const archiveButton = Array.from(menuItems).find(item =>
        item.textContent?.includes('Archive Task')
      ) as HTMLElement;

      archiveButton?.click();
      fixture.detectChanges();
      tick();

      expect(component.archiveTask.emit).toHaveBeenCalledWith(component.task);
    }));

    it('should emit editTask event when edit button is clicked', fakeAsync(() => {
      spyOn(component.editTask, 'emit');
      component.task.state = 'todo';
      fixture.detectChanges();

      // Open the menu
      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      menuButton.nativeElement.click();
      fixture.detectChanges();
      tick();

      const menuItems = document.querySelectorAll('button[mat-menu-item]');
      const editButton = Array.from(menuItems).find(item =>
        item.textContent?.includes('Edit Task')
      ) as HTMLElement;

      editButton?.click();
      fixture.detectChanges();
      tick();

      expect(component.editTask.emit).toHaveBeenCalledWith(component.task);
    }));
  });

  describe('Action buttons', () => {
    it('should show START button for todo tasks', () => {
      component.task.state = 'todo';
      fixture.detectChanges();
      const startButton = fixture.debugElement.query(By.css('button[color="primary"]'));
      expect(startButton?.nativeElement.textContent.trim()).toBe('START');
    });

    it('should emit startTask event when START button is clicked', () => {
      spyOn(component.startTask, 'emit');
      component.task.state = 'todo';
      fixture.detectChanges();

      const startButton = fixture.debugElement.query(By.css('button[color="primary"]'));
      startButton.nativeElement.click();

      expect(component.startTask.emit).toHaveBeenCalledWith(component.task);
    });

    it('should show COMPLETE button for in_progress tasks', () => {
      component.task.state = 'in_progress';
      fixture.detectChanges();
      const completeButton = fixture.debugElement.query(By.css('button[color="accent"]'));
      expect(completeButton?.nativeElement.textContent.trim()).toBe('COMPLETE');
    });

    it('should emit completeTask event when COMPLETE button is clicked', () => {
      spyOn(component.completeTask, 'emit');
      component.task.state = 'in_progress';
      fixture.detectChanges();

      const completeButton = fixture.debugElement.query(By.css('button[color="accent"]'));
      completeButton.nativeElement.click();

      expect(component.completeTask.emit).toHaveBeenCalledWith(component.task);
    });
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
