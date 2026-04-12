import { type Locator, type Page, expect } from '@playwright/test';

export class UserProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailText: Locator;
  readonly displayNameText: Locator;
  readonly roleText: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('mat-card-title', { hasText: 'User Profile' });
    this.emailText = page.locator('.user-info p', { hasText: 'Email:' });
    this.displayNameText = page.locator('.user-info p', {
      hasText: 'Display name:',
    });
    this.roleText = page.locator('.user-info p', { hasText: 'Role:' });
    this.backButton = page.locator('.profile-card .back-button');
  }

  async goto() {
    await this.page.goto('/profile');
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async getUsername(): Promise<string> {
    const text = (await this.emailText.textContent()) ?? '';
    // Text is like "Email: user@example.com" — extract the value
    return text.replace(/^\s*Email:\s*/, '').trim();
  }

  async getDisplayName(): Promise<string> {
    const text = (await this.displayNameText.textContent()) ?? '';
    return text.replace(/^\s*Display name:\s*/, '').trim();
  }

  async getRole(): Promise<string> {
    const text = (await this.roleText.textContent()) ?? '';
    return text.replace(/^\s*Role:\s*/, '').trim();
  }

  async goBack() {
    await this.backButton.click();
  }
}
