import { test, expect, type Page } from '@playwright/test';

/**
 * Helper: create a task via the Add Task dialog and return its title.
 * Navigates to the Plan It tab so the new task is visible in the kanban.
 */
async function createTask(
  page: Page,
  title: string,
  description: string
): Promise<void> {
  // Click the FAB "add" button to open the task form dialog
  await page.locator('button.add-task-button').click();
  await expect(
    page.getByRole('heading', { name: 'Add New Task' })
  ).toBeVisible({ timeout: 5_000 });

  // Fill the form
  await page.getByLabel('Title').fill(title);
  await page.getByLabel('Description').fill(description);

  // Submit
  await page.getByRole('button', { name: 'Add Task' }).click();

  // Wait for dialog to close
  await expect(
    page.getByRole('heading', { name: 'Add New Task' })
  ).toBeHidden({ timeout: 10_000 });
}

/**
 * Helper: switch to the Plan It tab and wait for columns to render.
 */
async function goToPlanIt(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Plan It' }).click();
  // Wait for the Plan It tab panel to be visible (toolbar buttons always present)
  await expect(page.getByRole('button', { name: /Show Archived/i })).toBeVisible({
    timeout: 10_000,
  });
}

/**
 * Helper: ensure "All Tasks" mode is active (not "My Tasks" filter).
 * This makes test-created tasks always visible regardless of assignment.
 */
async function ensureAllTasksMode(page: Page): Promise<void> {
  const myTasksBtn = page.getByRole('button', { name: /My Tasks/i });
  // If "My Tasks" button is visible, click it to switch to "All Tasks"
  if (await myTasksBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await myTasksBtn.click();
    // After clicking, the button text changes to "All Tasks"
    await expect(
      page.getByRole('button', { name: /All Tasks/i })
    ).toBeVisible({ timeout: 5_000 });
  }
}

/**
 * Helper: find a task card by its title text within the Plan It view.
 */
function taskCard(page: Page, title: string) {
  return page.locator('app-task-card', { hasText: title });
}

/**
 * Helper: archive (delete) a task from the Plan It view by opening its
 * three-dot menu and clicking Archive Task. Works on tasks in 'todo' state.
 */
async function archiveTaskFromMenu(page: Page, title: string): Promise<void> {
  const card = taskCard(page, title);
  await card.locator('button.more-actions').click();
  await page
    .getByRole('menuitem', { name: /Archive Task/i })
    .click();
  // Wait for the snackbar confirming archival
  await expect(
    page.locator('.mat-mdc-snack-bar-container', { hasText: /archived/i })
  ).toBeVisible({ timeout: 10_000 });
}

test.describe('Task CRUD Lifecycle', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('create a new task', async ({ page }) => {
    const title = `E2E Create ${Date.now()}`;
    const description = 'Created by Playwright E2E test';

    // Navigate to main view
    await page.goto('/');
    await expect(page.locator('.main-view')).toBeVisible({ timeout: 10_000 });

    // Switch to Plan It to see full board
    await goToPlanIt(page);
    await ensureAllTasksMode(page);

    // Create a task
    await createTask(page, title, description);

    // Reload the Plan It board and verify the task shows up in "To Do"
    await goToPlanIt(page);
    await ensureAllTasksMode(page);
    const card = taskCard(page, title);
    await expect(card).toBeVisible({ timeout: 10_000 });
    await expect(card).toContainText(description);

    // Clean up: archive the task via menu
    await archiveTaskFromMenu(page, title);
  });

  test('edit a task', async ({ page }) => {
    const originalTitle = `E2E Edit ${Date.now()}`;
    const updatedTitle = `E2E Edited ${Date.now()}`;
    const description = 'Original description for edit test';

    // Navigate and create a task
    await page.goto('/');
    await expect(page.locator('.main-view')).toBeVisible({ timeout: 10_000 });
    await goToPlanIt(page);
    await ensureAllTasksMode(page);
    await createTask(page, originalTitle, description);

    // Verify the task appears
    await goToPlanIt(page);
    await ensureAllTasksMode(page);
    await expect(taskCard(page, originalTitle)).toBeVisible({ timeout: 10_000 });

    // Open the three-dot menu on the task card and click "Edit Task"
    const card = taskCard(page, originalTitle);
    await card.locator('button.more-actions').click();
    await page
      .getByRole('menuitem', { name: /Edit Task/i })
      .click();

    // The edit dialog opens with "Edit Task" heading
    await expect(
      page.getByRole('heading', { name: 'Edit Task' })
    ).toBeVisible({ timeout: 5_000 });

    // Clear and re-fill the title
    const titleInput = page.getByLabel('Title');
    await titleInput.clear();
    await titleInput.fill(updatedTitle);

    // Submit via "Save Changes"
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(
      page.getByRole('heading', { name: 'Edit Task' })
    ).toBeHidden({ timeout: 10_000 });

    // Reload the page and verify the title persisted
    await page.reload();
    await goToPlanIt(page);
    await ensureAllTasksMode(page);
    await expect(taskCard(page, updatedTitle)).toBeVisible({ timeout: 10_000 });
    // The original title should no longer be visible as a task card
    await expect(taskCard(page, originalTitle)).toBeHidden({ timeout: 5_000 });

    // Clean up: archive the edited task
    await archiveTaskFromMenu(page, updatedTitle);
  });

  test('complete and archive a task', async ({ page }) => {
    const title = `E2E Lifecycle ${Date.now()}`;
    const description = 'Full lifecycle: create -> start -> complete -> archive';

    // Navigate and create a task
    await page.goto('/');
    await expect(page.locator('.main-view')).toBeVisible({ timeout: 10_000 });
    await goToPlanIt(page);
    await ensureAllTasksMode(page);
    await createTask(page, title, description);

    // Verify it shows in "To Do" column
    await goToPlanIt(page);
    await ensureAllTasksMode(page);
    const card = taskCard(page, title);
    await expect(card).toBeVisible({ timeout: 10_000 });

    // --- START the task ---
    await card.getByRole('button', { name: 'START' }).click();

    // The card should now appear in the "In Progress" column
    // Wait for the card to move — the START button disappears, COMPLETE appears
    await expect(card.getByRole('button', { name: 'COMPLETE' })).toBeVisible({
      timeout: 10_000,
    });

    // --- COMPLETE the task ---
    await card.getByRole('button', { name: 'COMPLETE' }).click();

    // The card should now be in the "Done" column — verify archive button appears (last button on card)
    const archiveBtn = card.locator('button').last();
    await expect(archiveBtn).toBeVisible({ timeout: 10_000 });

    // --- ARCHIVE the task ---
    await archiveBtn.click();
    // The snackbar confirms archival
    await expect(
      page.locator('.mat-mdc-snack-bar-container', { hasText: /archived/i })
    ).toBeVisible({ timeout: 10_000 });

    // Enable "Show Archived" and verify the task is in the Archived column
    await page
      .getByRole('button', { name: /Show Archived/i })
      .click();
    await expect(
      page.locator('.column', { hasText: 'Archived' }).locator('app-task-card', { hasText: title })
    ).toBeVisible({ timeout: 10_000 });

    // Task is archived — no further cleanup needed
  });
});
