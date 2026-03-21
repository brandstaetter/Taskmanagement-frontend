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

  describe('Date formatting methods', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-19T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format timespan for future tasks', () => {
      component.task.due_date = '2025-02-20T12:00:00Z'; // 24 hours from now
      const timespan = component.getTimespan(component.task.due_date);
      expect(timespan).toBe('in 1 day');
    });

    it('should format timespan for past tasks', () => {
      component.task.due_date = '2025-02-18T12:00:00Z'; // 24 hours ago
      const timespan = component.getTimespan(component.task.due_date);
      expect(timespan).toBe('1 day ago');
    });

    it('should format timespan for hours and minutes', () => {
      component.task.due_date = '2025-02-19T13:30:00Z'; // 1 hour 30 minutes from now
      const timespan = component.getTimespan(component.task.due_date);
      expect(timespan).toBe('in 1 hour and 30 minutes');
    });

    it('should format timespan for just now', () => {
      component.task.due_date = '2025-02-19T12:01:00Z'; // 1 minute ago
      const timespan = component.getTimespan(component.task.due_date);
      expect(timespan).toBe('in 1 minute');
    });

    it('should format timespan for less than a minute', () => {
      component.task.due_date = '2025-02-19T12:00:30Z'; // 30 seconds from now
      const timespan = component.getTimespan(component.task.due_date);
      expect(timespan).toBe('in less than a minute');
    });

    it('should return empty string for null due date', () => {
      component.task.due_date = null;
      const timespan = component.getTimespan(component.task.due_date);
      expect(timespan).toBe('');
    });

    it('should return empty string for undefined due date', () => {
      component.task.due_date = undefined;
      const timespan = component.getTimespan(component.task.due_date);
      expect(timespan).toBe('');
    });
  });

  describe('isDueSoon method', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-19T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true for tasks due within threshold', () => {
      component.task.due_date = '2025-02-19T20:00:00Z'; // 8 hours from now
      expect(component.isDueSoon(component.task)).toBe(true);
    });

    it('should return false for tasks due beyond threshold', () => {
      component.task.due_date = '2025-02-20T12:00:00Z'; // 24 hours from now
      expect(component.isDueSoon(component.task)).toBe(false);
    });

    it('should return false for overdue tasks', () => {
      component.task.due_date = '2025-02-18T12:00:00Z'; // 24 hours ago
      expect(component.isDueSoon(component.task)).toBe(false);
    });

    it('should return false for tasks without due date', () => {
      component.task.due_date = null;
      expect(component.isDueSoon(component.task)).toBe(false);
    });
  });

  describe('getTaskClass method', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-19T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return archived-task for archived tasks', () => {
      component.task.state = 'archived';
      expect(component.getTaskClass()).toBe('archived-task');
    });

    it('should return overdue for overdue tasks', () => {
      component.task.state = 'todo';
      component.task.due_date = '2025-02-18T12:00:00Z'; // 24 hours ago
      expect(component.getTaskClass()).toBe('overdue');
    });

    it('should return due-soon for tasks due soon', () => {
      component.task.state = 'todo';
      component.task.due_date = '2025-02-19T20:00:00Z'; // 8 hours from now
      expect(component.getTaskClass()).toBe('due-soon');
    });

    it('should return empty string for normal tasks', () => {
      component.task.state = 'todo';
      component.task.due_date = '2025-02-20T12:00:00Z'; // 24 hours from now
      expect(component.getTaskClass()).toBe('');
    });
  });

  describe('Method existence', () => {
    it('should have getTimespan method', () => {
      expect(component.getTimespan).toBeDefined();
      expect(typeof component.getTimespan).toBe('function');
    });

    it('should have isOverdue method', () => {
      expect(component.isOverdue).toBeDefined();
      expect(typeof component.isOverdue).toBe('function');
    });

    it('should have isDueSoon method', () => {
      expect(component.isDueSoon).toBeDefined();
      expect(typeof component.isDueSoon).toBe('function');
    });

    it('should have getTaskClass method', () => {
      expect(component.getTaskClass).toBeDefined();
      expect(typeof component.getTaskClass).toBe('function');
    });
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
      jest.spyOn(component.reopenTask, 'emit');
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

      expect(reopenButton).toBeTruthy();
      reopenButton?.click();
      fixture.detectChanges();
      tick();

      expect(component.reopenTask.emit).toHaveBeenCalledWith(component.task);
    }));

    it('should emit archiveTask event when archive button is clicked', fakeAsync(() => {
      jest.spyOn(component.archiveTask, 'emit');
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
      jest.spyOn(component.editTask, 'emit');
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
      jest.spyOn(component.startTask, 'emit');
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
      jest.spyOn(component.completeTask, 'emit');
      component.task.state = 'in_progress';
      fixture.detectChanges();

      const completeButton = fixture.debugElement.query(By.css('button[color="accent"]'));
      completeButton.nativeElement.click();

      expect(component.completeTask.emit).toHaveBeenCalledWith(component.task);
    });
  });

  describe('Reward chip', () => {
    it('should display reward text including emoji in the chip', () => {
      component.task.reward = 'Movie night 🎬';
      fixture.detectChanges();
      const chip = fixture.debugElement.query(By.css('mat-chip'));
      expect(chip).toBeTruthy();
      expect(chip.nativeElement.textContent).toContain('Movie night 🎬');
    });

    it('should not render reward chip when reward is absent', () => {
      component.task.reward = undefined;
      fixture.detectChanges();
      const chipSet = fixture.debugElement.query(By.css('mat-chip-set'));
      expect(chipSet).toBeFalsy();
    });
  });

  describe('Overdue warning', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-19T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
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

  describe('viewDetails event', () => {
    it('should emit viewDetails event when menu item is clicked', fakeAsync(() => {
      jest.spyOn(component.viewDetails, 'emit');
      component.task.state = 'todo';
      fixture.detectChanges();

      const menuButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      menuButton.nativeElement.click();
      fixture.detectChanges();
      tick();

      const menuItems = document.querySelectorAll('button[mat-menu-item]');
      const viewDetailsButton = Array.from(menuItems).find(item =>
        item.textContent?.includes('View Details')
      ) as HTMLElement;

      expect(viewDetailsButton).toBeTruthy();
      viewDetailsButton?.click();
      fixture.detectChanges();
      tick();

      expect(component.viewDetails.emit).toHaveBeenCalledWith(component.task);
    }));

    it('should emit viewDetails from print-only mode footer', () => {
      jest.spyOn(component.viewDetails, 'emit');
      component.mode = 'print-only';
      component.task.state = 'todo';
      fixture.detectChanges();

      const footerButtons = fixture.debugElement.queryAll(
        By.css('.footer-right button[mat-icon-button]')
      );
      const detailsButton = footerButtons.find(
        btn => btn.nativeElement.querySelector('mat-icon')?.textContent?.trim() === 'visibility'
      );

      expect(detailsButton).toBeTruthy();
      detailsButton?.nativeElement.click();

      expect(component.viewDetails.emit).toHaveBeenCalledWith(component.task);
    });
  });

  describe('Assignee display', () => {
    it('getAssigneesTooltip should list all assignee display names', () => {
      component.task = {
        ...component.task,
        assigned_users_display: [
          { id: 1, display_name: 'Alice' },
          { id: 2, display_name: 'Bob' },
        ],
      };
      expect(component.getAssigneesTooltip()).toBe('Assigned to: Alice, Bob');
    });

    it('getAssigneesTooltip should fall back to id when display_name is null', () => {
      component.task = {
        ...component.task,
        assigned_users_display: [{ id: 42, display_name: null }],
      };
      expect(component.getAssigneesTooltip()).toBe('Assigned to: 42');
    });

    it('getAssigneesTooltip should return empty assignee list when no assignees', () => {
      component.task = { ...component.task, assigned_users_display: [] };
      expect(component.getAssigneesTooltip()).toBe('Assigned to: ');
    });

    it('getAssigneeInitial should return first letter of display_name uppercased', () => {
      expect(component.getAssigneeInitial({ id: 1, display_name: 'alice' })).toBe('A');
    });

    it('getAssigneeInitial should fall back to id string when display_name is null', () => {
      expect(component.getAssigneeInitial({ id: 7, display_name: null })).toBe('7');
    });
  });

  describe('Avatar display', () => {
    it('should show creator avatar image when creator_avatar_url is set', () => {
      component.task = {
        id: 1,
        title: 'Test',
        description: 'Desc',
        state: 'todo',
        creator_display_name: 'Alice',
        creator_avatar_url: 'https://gravatar.com/avatar/abc',
      };
      fixture.detectChanges();

      const avatarImg = fixture.debugElement.query(By.css('.meta-avatar'));
      expect(avatarImg).toBeTruthy();
      expect(avatarImg.nativeElement.src).toContain('gravatar.com');
    });

    it('should show person_outline icon when no creator avatar', () => {
      component.task = {
        id: 1,
        title: 'Test',
        description: 'Desc',
        state: 'todo',
        creator_display_name: 'Alice',
      };
      fixture.detectChanges();

      const avatarImg = fixture.debugElement.query(By.css('.meta-item .meta-avatar'));
      expect(avatarImg).toBeFalsy();
      const icon = fixture.debugElement.query(By.css('.meta-item mat-icon'));
      expect(icon).toBeTruthy();
      expect(icon.nativeElement.textContent.trim()).toBe('person_outline');
    });

    it('should show worker avatar image when worker_avatar_url is set and in_progress', () => {
      component.task = {
        id: 1,
        title: 'Test',
        description: 'Desc',
        state: 'in_progress',
        worker_display_name: 'Bob',
        worker_avatar_url: 'https://gravatar.com/avatar/def',
      };
      fixture.detectChanges();

      const avatars = fixture.debugElement.queryAll(By.css('.meta-avatar'));
      const workerAvatar = avatars.find(
        a => a.nativeElement.src && a.nativeElement.src.includes('def')
      );
      expect(workerAvatar).toBeTruthy();
    });

    it('should not show worker avatar when task is not in_progress', () => {
      component.task = {
        id: 1,
        title: 'Test',
        description: 'Desc',
        state: 'todo',
        worker_display_name: 'Bob',
        worker_avatar_url: 'https://gravatar.com/avatar/def',
      };
      fixture.detectChanges();

      const avatars = fixture.debugElement.queryAll(By.css('.meta-avatar'));
      const workerAvatar = avatars.find(
        a => a.nativeElement.src && a.nativeElement.src.includes('def')
      );
      expect(workerAvatar).toBeFalsy();
    });
  });
});
