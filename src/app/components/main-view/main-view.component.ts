import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TaskViewComponent } from '../task-view/task-view.component';
import { PlanItComponent } from '../plan-it/plan-it.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    TaskViewComponent,
    PlanItComponent
  ]
})
export class MainViewComponent {
  currentView: 'do-it' | 'plan-it' = 'do-it';
  selectedIndex = 0;
  @ViewChild(TaskViewComponent) taskView!: TaskViewComponent;
  @ViewChild(PlanItComponent) planIt!: PlanItComponent;

  constructor(private dialog: MatDialog) {}

  onTabChange(index: number): void {
    this.selectedIndex = index;
    this.currentView = index === 0 ? 'do-it' : 'plan-it';
    
    // Refresh the data of the selected tab
    if (index === 0 && this.taskView) {
      this.taskView.loadDueTasks();
    } else if (index === 1 && this.planIt) {
      this.planIt.loadTasks();
    }
  }

  openAddTaskDialog(): void {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.currentView === 'do-it' && this.taskView) {
        this.taskView.loadDueTasks();
      } else if (result && this.currentView === 'plan-it' && this.planIt) {
        this.planIt.loadTasks();
      }
    });
  }
}
