import { type Locator, type Page, expect } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly usersTab: Locator;
  readonly userRows: Locator;
  readonly usersTable: Locator;
  readonly spinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('mat-card-title', { hasText: 'Admin' });
    this.usersTab = page.getByRole('tab', { name: 'Users' });
    this.usersTable = page.locator('.users-table');
    this.userRows = page.locator('.users-table .mat-mdc-row');
    this.spinner = page.locator('mat-spinner');
  }

  async goto() {
    await this.page.goto('/admin');
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async switchToUsersTab() {
    await this.usersTab.click();
    // Wait for the spinner to disappear and table to appear
    await expect(this.spinner).toBeHidden({ timeout: 10_000 });
  }

  getUserList(): Locator {
    return this.userRows;
  }

  async getUserCount(): Promise<number> {
    // Ensure we're on the Users tab and data has loaded
    await expect(this.usersTable).toBeVisible({ timeout: 10_000 });
    return this.userRows.count();
  }
}
