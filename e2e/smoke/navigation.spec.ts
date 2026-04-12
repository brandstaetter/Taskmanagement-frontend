import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TaskListPage } from '../pages/task-list.page';
import { TaskDetailPage } from '../pages/task-detail.page';
import { AdminPage } from '../pages/admin.page';
import { UserProfilePage } from '../pages/user-profile.page';

test.describe('Smoke Tests - Navigation', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('login page renders', async ({ page }) => {
    // Clear auth state for this test so the guard redirects to login
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto('/login');
    const loginPage = new LoginPage(page);
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    // Verify branding is present
    await expect(page.locator('.brand-name')).toHaveText('TASKMAN');
  });

  test('main task view loads after login', async ({ page }) => {
    const taskList = new TaskListPage(page);
    await taskList.goto();

    // Verify the main view rendered: either task cards or the no-tasks message
    await expect(
      taskList.taskCards.first().or(taskList.noTasksMessage)
    ).toBeVisible({ timeout: 10_000 });

    // Verify tab navigation is present
    await expect(taskList.doItTab).toBeVisible();
    await expect(taskList.planItTab).toBeVisible();

    // Verify the header branding
    await expect(page.locator('.app-title')).toHaveText('TASKMAN');
  });

  test('task detail view loads', async ({ page }) => {
    const taskList = new TaskListPage(page);
    await taskList.goto();

    const taskCount = await taskList.getTaskCount();
    // If there are no tasks, skip this test gracefully
    test.skip(taskCount === 0, 'No tasks available to navigate to');

    // Click the first task's "View Details" button
    await taskList.clickTask(0);

    // Verify we navigated to the detail route
    await expect(page).toHaveURL(/\/tasks\/\d+\/details/);

    // Verify the detail page rendered
    const detail = new TaskDetailPage(page);
    await detail.waitForLoaded();
    const title = await detail.getTitle();
    expect(title.length).toBeGreaterThan(0);

    // Verify the status chip is visible
    await expect(detail.statusChip).toBeVisible();

    // Verify the back button works
    await expect(detail.backButton).toBeVisible();
  });

  test('user profile loads', async ({ page }) => {
    const profile = new UserProfilePage(page);
    await profile.goto();

    // Verify profile heading
    await expect(profile.heading).toBeVisible();

    // Verify user info section rendered with content
    await expect(profile.emailText).toBeVisible();
    await expect(profile.displayNameText).toBeVisible();
    await expect(profile.roleText).toBeVisible();
  });

  test('no console errors on navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate through the main pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors (e.g. favicon 404, third-party scripts)
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('ERR_CONNECTION_REFUSED') &&
        !e.includes('net::')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('responsive mobile layout', async ({ page }) => {
    // Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify no horizontal overflow: scrollWidth should not exceed clientWidth
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    // Verify the main content is still visible
    await expect(page.locator('.app-title')).toBeVisible();
  });
});

test.describe('Smoke Tests - Admin', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('admin dashboard loads', async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.goto();

    // Verify the admin heading is visible
    await expect(admin.heading).toBeVisible();

    // Switch to Users tab and verify the user list renders
    await admin.switchToUsersTab();
    await expect(admin.usersTable).toBeVisible({ timeout: 10_000 });

    // Verify at least one user row exists (the admin themselves)
    const userCount = await admin.getUserCount();
    expect(userCount).toBeGreaterThan(0);
  });
});
