import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('admin creates and deletes a user', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const testEmail = `e2e-user-${uniqueSuffix}@test.example.com`;
    const testPassword = 'E2eTest!234';

    // Navigate to admin dashboard
    await page.goto('/admin');
    await expect(
      page.locator('mat-card-title', { hasText: 'Admin' })
    ).toBeVisible({ timeout: 10_000 });

    // --- Create a user on the "Create User" tab ---
    // The "Create User" tab is the first tab — it should be active by default
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 5_000 });

    // Fill the create user form
    await page.getByLabel('Email').fill(testEmail);
    await page.getByLabel('Password').fill(testPassword);

    // Submit the form
    await page.getByRole('button', { name: /Create User/i }).click();

    // Wait for success snackbar
    await expect(
      page.locator('.mat-mdc-snack-bar-container', {
        hasText: /User created successfully/i,
      })
    ).toBeVisible({ timeout: 10_000 });

    // --- Switch to "Users" tab and verify the user appears ---
    await page.getByRole('tab', { name: 'Users' }).click();

    // Wait for the spinner to disappear and the table to render
    await expect(page.locator('mat-spinner')).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('.users-table')).toBeVisible({
      timeout: 10_000,
    });

    // Find the row containing our test email
    const userRow = page.locator('.users-table .mat-mdc-row', {
      hasText: testEmail,
    });
    await expect(userRow).toBeVisible({ timeout: 10_000 });

    // --- Delete the user ---
    // Click the delete button (trash icon) - it's the last button in the row
    const deleteBtn = userRow.locator('button').last();
    await deleteBtn.click();

    // The confirm dialog should appear
    await expect(
      page.getByRole('heading', { name: 'Delete User' })
    ).toBeVisible({ timeout: 5_000 });

    // Click "Confirm" to proceed with deletion
    await page.getByRole('button', { name: /Confirm/i }).click();

    // Wait for success snackbar confirming deletion
    await expect(
      page.locator('.mat-mdc-snack-bar-container', {
        hasText: /deleted successfully/i,
      })
    ).toBeVisible({ timeout: 10_000 });

    // Reload the page and switch back to Users tab to verify deletion persisted
    await page.reload();
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.locator('.users-table')).toBeVisible({ timeout: 10_000 });

    // Verify the user row is gone from the table
    await expect(userRow).toBeHidden({ timeout: 10_000 });
  });
});
