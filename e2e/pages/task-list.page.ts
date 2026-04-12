import { type Locator, type Page, expect } from '@playwright/test';

export class TaskListPage {
  readonly page: Page;
  readonly taskCards: Locator;
  readonly doItTab: Locator;
  readonly planItTab: Locator;
  readonly noTasksMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.taskCards = page.locator('app-task-card');
    this.doItTab = page.getByRole('tab', { name: 'Do It' });
    this.planItTab = page.getByRole('tab', { name: 'Plan It' });
    this.noTasksMessage = page.locator('.no-tasks');
  }

  async goto() {
    await this.page.goto('/');
    // Wait for either task cards or the no-tasks message to appear
    await expect(
      this.taskCards.first().or(this.noTasksMessage)
    ).toBeVisible({ timeout: 10_000 });
  }

  getTaskCards(): Locator {
    return this.taskCards;
  }

  async clickTask(index: number) {
    const card = this.taskCards.nth(index);
    // Click the "View Details" icon button on the card
    await card.getByRole('button', { name: /view details/i }).click();
  }

  async getTaskCount(): Promise<number> {
    return this.taskCards.count();
  }
}
