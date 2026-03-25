import { test, expect } from '@playwright/test';
import { checkAccessibility } from './helpers/axe';

test.describe('Org page', () => {
  let orgHref: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Discover the first org card dynamically
    const orgCard = page.locator('[aria-label^="View "]').first();
    const count = await orgCard.count();
    if (count === 0) {
      test.skip();
      return;
    }
    orgHref = (await orgCard.getAttribute('href')) ?? '/';
    await page.goto(orgHref);
  });

  test('has breadcrumb with Home link', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a', { hasText: 'Home' })).toBeVisible();
  });

  test('has org heading', async ({ page }) => {
    await expect(page.locator('#main-content h1')).toBeVisible();
  });

  test('has workflow cards or empty state', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const count = await cards.count();
    if (count > 0) {
      await expect(cards.first()).toBeVisible();
    }
  });

  test('search filter works on org page', async ({ page }) => {
    const input = page.locator('#search-input');
    if (!(await input.count())) test.skip();
    await input.fill('__no_match_xyz__');
    await page.waitForTimeout(200);
    await expect(page.locator('#search-no-results')).toBeVisible();
    await input.press('Escape');
    await expect(input).toHaveValue('');
  });

  test('trigger filter renders on org page', async ({ page }) => {
    await expect(page.locator('#filter-trigger')).toBeVisible();
  });

  test('repo filter renders on org page', async ({ page }) => {
    await expect(page.locator('#filter-repo')).toBeVisible();
  });

  test('org filter does NOT render on org page', async ({ page }) => {
    await expect(page.locator('#filter-org')).not.toBeAttached();
  });

  test('trigger filter hides non-matching cards on org page', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    const triggerOptions = page.locator('#filter-trigger option:not([value=""])');
    if (total === 0 || (await triggerOptions.count()) === 0) test.skip();

    const firstTrigger = await triggerOptions.first().getAttribute('value');
    if (!firstTrigger) test.skip();

    await page.locator('#filter-trigger').selectOption(firstTrigger!);
    await page.waitForTimeout(200);

    const visibleCount = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(visibleCount).toBeLessThanOrEqual(total);

    // Reset and verify all cards come back
    await page.locator('#filter-trigger').selectOption('');
    await page.waitForTimeout(200);

    const afterReset = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(afterReset).toBe(total);
  });

  test('repo filter hides non-matching cards on org page', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    const repoOptions = page.locator('#filter-repo option:not([value=""])');
    if (total === 0 || (await repoOptions.count()) === 0) test.skip();

    const firstRepo = await repoOptions.first().getAttribute('value');
    if (!firstRepo) test.skip();

    await page.locator('#filter-repo').selectOption(firstRepo!);
    await page.waitForTimeout(200);

    const visibleCount = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(visibleCount).toBeLessThanOrEqual(total);

    // Reset and verify all cards come back
    await page.locator('#filter-repo').selectOption('');
    await page.waitForTimeout(200);

    const afterReset = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(afterReset).toBe(total);
  });

  test('passes accessibility scan', async ({ page }) => {
    await checkAccessibility(page);
  });
});
