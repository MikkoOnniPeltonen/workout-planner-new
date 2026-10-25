import { mkdir } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('demo shows training history and statistics, and logout revokes access', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await mkdir('docs/screenshots', { recursive: true });
  await page.locator('img').evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        image.loading = 'eager';
        await image.decode();
      }),
    );
  });
  await page.screenshot({
    path: `docs/screenshots/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('How to go hard');
  await expect(page.getByRole('button', { name: 'Try the demo' })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Create an account', exact: true })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'How it works', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try the demo' }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Strength foundations', { exact: true })).toBeVisible();
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'History', exact: true })).toBeVisible();
  await page.goto('/statistics');
  await expect(page.getByRole('heading', { name: 'Your progress', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Personal records', exact: true })).toBeVisible();
  await page.screenshot({
    path: `docs/screenshots/statistics-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login');
});

test('signup, quick plan, draft recovery, and a lost save response do not duplicate a session', async ({
  page,
}) => {
  await page.goto('/signup');
  await page.getByLabel('Name', { exact: true }).fill('Browser athlete');
  await page
    .getByLabel('Email', { exact: true })
    .fill(`athlete-${crypto.randomUUID()}@example.com`);
  await page.getByLabel('Password', { exact: true }).fill('Training1234567');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.getByRole('link', { name: 'Quick start' }).click();
  await page.getByRole('button', { name: 'Save workout' }).click();
  await expect(page).toHaveURL('/dashboard');
  await page
    .getByRole('link', { name: /Start workout:/ })
    .first()
    .click();
  await page
    .getByLabel(/Reps for set 1/)
    .first()
    .fill('8');
  await page.reload();
  await expect(page.getByText('Restored your unsaved session.')).toBeVisible();
  await page
    .getByRole('button', { name: /^Complete set 1/ })
    .first()
    .click();
  let dropped = false;
  await page.route('**/api/sessions', async (route) => {
    if (route.request().method() === 'POST' && !dropped) {
      dropped = true;
      await route.fetch(); // Server committed the write; client never receives the reply.
      await route.abort('connectionfailed');
    } else await route.continue();
  });
  await page.getByRole('button', { name: 'Save session', exact: true }).click();
  const saveCompleted = page.getByRole('button', { name: 'Save ticked sets only', exact: true });
  if (await saveCompleted.isVisible()) await saveCompleted.click();
  await expect(page).toHaveURL('/history');
  await expect
    .poll(() =>
      page.evaluate(
        () => Object.keys(localStorage).filter((key) => key.startsWith('workout-outbox:')).length,
      ),
    )
    .toBe(0);
  const response = await page.request.get('/api/sessions');
  expect((await response.json()).length).toBe(1);
});

test('offline save survives a reload and syncs when the connection returns', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the demo' }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'History', exact: true })).toBeVisible();
  await page.goto('/dashboard');
  await page
    .getByRole('link', { name: /Start workout:/ })
    .first()
    .click();
  const complete = page.getByRole('button', { name: /^Complete set 1/ }).first();
  await expect(complete).toBeVisible();
  await complete.click();
  // Cached demo targets fill the completed set. Wait for the app shell to be installed.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Save session', exact: true }).click();
  await expect(page).toHaveURL('/history');
  await expect(page.getByText(/1 session waiting to sync/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/1 session waiting to sync/)).toBeVisible();
  await context.setOffline(false);
  await expect
    .poll(() =>
      page.evaluate(
        () => Object.keys(localStorage).filter((key) => key.startsWith('workout-outbox:')).length,
      ),
    )
    .toBe(0);
  const response = await page.request.get('/api/sessions/stats');
  expect((await response.json()).totalSessions).toBe(37);
});
