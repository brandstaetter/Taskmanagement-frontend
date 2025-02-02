import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskViewComponent } from './components/task-view/task-view.component';
import { PlanItComponent } from './components/plan-it/plan-it.component';
import { provideAnimations } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatTabsModule,
    TaskViewComponent,
    PlanItComponent,
    MatDialogModule
  ],
  providers: [
    provideAnimations()
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
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
      if (result) {
        // Refresh both views if a task was added
        if (this.taskView) {
          this.taskView.loadDueTasks();
        }
        if (this.planIt) {
          this.planIt.loadTasks();
        }
      }
    });
  }
}
