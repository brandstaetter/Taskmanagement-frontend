import { type Locator, type Page, expect } from '@playwright/test';

export class TaskDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly statusChip: Locator;
  readonly description: Locator;
  readonly backButton: Locator;
  readonly actionButton: Locator;
  readonly reopenButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.task-details mat-card-title');
    this.statusChip = page.locator('.task-details .status-chip');
    this.description = page.locator('.task-details .description p');
    this.backButton = page.locator('.task-details .back-button');
    this.actionButton = page.locator(
      '.task-details mat-card-footer button[color="primary"]'
    );
    this.reopenButton = page.getByRole('button', { name: /reopen task/i });
  }

  async waitForLoaded() {
    await expect(this.title).toBeVisible({ timeout: 10_000 });
  }

  async getTitle(): Promise<string> {
    await this.waitForLoaded();
    return (await this.title.textContent()) ?? '';
  }

  async getStatus(): Promise<string> {
    return (await this.statusChip.textContent())?.trim() ?? '';
  }

  async getDescription(): Promise<string> {
    return (await this.description.textContent())?.trim() ?? '';
  }

  async goBack() {
    await this.backButton.click();
  }
}
