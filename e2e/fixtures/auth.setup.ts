import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

const USER_FILE = 'e2e/.auth/user.json';
const ADMIN_FILE = 'e2e/.auth/admin.json';

setup('authenticate as regular user', async ({ page }) => {
  const username = process.env.E2E_USERNAME ?? 'testuser';
  const password = process.env.E2E_PASSWORD ?? 'testpass';

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);

  // Wait for redirect away from login page (longer timeout for slow production servers)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

  await page.context().storageState({ path: USER_FILE });
});

setup('authenticate as admin', async ({ page }) => {
  const username = process.env.E2E_ADMIN_USERNAME ?? 'admin';
  const password = process.env.E2E_ADMIN_PASSWORD ?? 'adminpass';

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);

  // Wait for redirect away from login page (longer timeout for slow production servers)
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

  await page.context().storageState({ path: ADMIN_FILE });
});
