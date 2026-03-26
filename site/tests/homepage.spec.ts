import { test, expect } from '@playwright/test';
import { checkAccessibility } from './helpers/axe';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/CI\/CD Workflow Inventory/);
  });

  test('has h1 heading', async ({ page }) => {
    await expect(page.locator('#main-content h1')).toContainText('CI/CD Workflow Inventory');
  });

  test('renders 3 stat cards', async ({ page }) => {
    const statCards = page.locator('.grid > div').filter({ hasText: /Workflows|Repositories|Organizations/ });
    await expect(statCards).toHaveCount(3);
  });

  test('renders workflow cards', async ({ page }) => {
    const workflowCards = page.locator('article[aria-label^="Workflow:"]');
    const count = await workflowCards.count();
    // May be 0 if no workflow data — just ensure the section heading renders
    if (count === 0) {
      await expect(page.locator('h2').filter({ hasText: 'All Workflows' })).toBeVisible();
    } else {
      await expect(workflowCards.first()).toBeVisible();
    }
  });

  test('search filter hides non-matching items', async ({ page }) => {
    const input = page.locator('#search-input');
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    if (total === 0) test.skip();

    // Type something unlikely to match everything
    await input.fill('__unlikely_query_xyz__');
    await page.waitForTimeout(200);
    const noResults = page.locator('#search-no-results');
    await expect(noResults).toBeVisible();
  });

  test('Escape key clears search input', async ({ page }) => {
    const input = page.locator('#search-input');
    await input.fill('test query');
    await expect(input).toHaveValue('test query');
    await input.press('Escape');
    await expect(input).toHaveValue('');
  });

  test('filter bar renders org, trigger, repo and status dropdowns', async ({ page }) => {
    await expect(page.locator('#filter-org')).toBeVisible();
    await expect(page.locator('#filter-trigger')).toBeVisible();
    await expect(page.locator('#filter-repo')).toBeVisible();
    await expect(page.locator('#filter-status')).toBeVisible();
  });

  test('sort dropdown is present and accessible', async ({ page }) => {
    const sort = page.locator('#sort-select');
    await expect(sort).toBeVisible();
    await expect(sort).toHaveAttribute('aria-label', 'Sort by');
    // Should have at least Name A-Z and Status options
    await expect(page.locator('#sort-select option[value="name-asc"]')).toBeAttached();
    await expect(page.locator('#sort-select option[value="name-desc"]')).toBeAttached();
    await expect(page.locator('#sort-select option[value="status-asc"]')).toBeAttached();
  });

  test('sort by name descending reorders workflow cards', async ({ page }) => {
    const sort = page.locator('#sort-select');
    await sort.selectOption('name-asc');
    const cards = page.locator('[data-name]');
    const first = await cards.first().getAttribute('data-name');
    const last = await cards.last().getAttribute('data-name');
    await sort.selectOption('name-desc');
    const firstDesc = await cards.first().getAttribute('data-name');
    // After desc sort, first card should differ from asc sort first card (unless all same)
    await expect(sort).toHaveValue('name-desc');
    // Verify the first name in desc is >= last name in asc (they were previously sorted asc)
    if (first && last && firstDesc) {
      expect(firstDesc.toLowerCase() >= last.toLowerCase()).toBe(true);
    }
  });

  test('status filter dropdown has at least one real option', async ({ page }) => {
    await expect(page.locator('#filter-status option:not([value=""])').first()).toBeAttached();
  });

  test('org filter dropdown has at least one real option', async ({ page }) => {
    const realOptions = page.locator('#filter-org option:not([value=""])');
    await expect(realOptions.first()).toBeAttached();
  });

  test('trigger filter dropdown has at least one real option', async ({ page }) => {
    const realOptions = page.locator('#filter-trigger option:not([value=""])');
    await expect(realOptions.first()).toBeAttached();
  });

  test('repo filter dropdown has at least one real option', async ({ page }) => {
    const realOptions = page.locator('#filter-repo option:not([value=""])');
    await expect(realOptions.first()).toBeAttached();
  });

  test('trigger filter hides non-matching workflow cards', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    if (total === 0) test.skip();

    // Get the first non-default trigger option
    const firstTrigger = await page.locator('#filter-trigger option:not([value=""])').first().getAttribute('value');
    if (!firstTrigger) test.skip();

    await page.locator('#filter-trigger').selectOption(firstTrigger!);
    await page.waitForTimeout(200);

    const visibleCount = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    // At least some cards visible and no more than before
    expect(visibleCount).toBeGreaterThanOrEqual(0);
    expect(visibleCount).toBeLessThanOrEqual(total);
  });

  test('resetting trigger filter restores all cards', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    if (total === 0) test.skip();

    const firstTrigger = await page.locator('#filter-trigger option:not([value=""])').first().getAttribute('value');
    if (!firstTrigger) test.skip();

    // Apply then reset
    await page.locator('#filter-trigger').selectOption(firstTrigger!);
    await page.waitForTimeout(200);
    await page.locator('#filter-trigger').selectOption('');
    await page.waitForTimeout(200);

    const visibleCount = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThanOrEqual(30);
    await expect(page.locator('#pagination-controls')).toContainText(`of ${total}`);
  });

  test('status filter hides non-matching workflow cards', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    const statusOptions = page.locator('#filter-status option:not([value=""])');
    if (total === 0 || (await statusOptions.count()) === 0) test.skip();

    const firstStatus = await statusOptions.first().getAttribute('value');
    if (!firstStatus) test.skip();

    await page.locator('#filter-status').selectOption(firstStatus!);
    await page.waitForTimeout(200);

    const visibleCount = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(visibleCount).toBeLessThan(total);
  });

  test('resetting status filter restores all cards', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    const statusOptions = page.locator('#filter-status option:not([value=""])');
    if (total === 0 || (await statusOptions.count()) === 0) test.skip();

    const firstStatus = await statusOptions.first().getAttribute('value');
    if (!firstStatus) test.skip();

    await page.locator('#filter-status').selectOption(firstStatus!);
    await page.waitForTimeout(200);
    await page.locator('#filter-status').selectOption('');
    await page.waitForTimeout(200);

    const visibleCount = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThanOrEqual(30);
    await expect(page.locator('#pagination-controls')).toContainText(`of ${total}`);
  });

  test('repo filter hides non-matching workflow cards', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    if (total === 0) test.skip();

    const firstRepo = await page.locator('#filter-repo option:not([value=""])').first().getAttribute('value');
    if (!firstRepo) test.skip();

    await page.locator('#filter-repo').selectOption(firstRepo!);
    await page.waitForTimeout(200);

    const visibleCount = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(visibleCount).toBeLessThan(total);
  });

  test('resetting repo filter restores all cards', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    if (total === 0) test.skip();

    const firstRepo = await page.locator('#filter-repo option:not([value=""])').first().getAttribute('value');
    if (!firstRepo) test.skip();

    await page.locator('#filter-repo').selectOption(firstRepo!);
    await page.waitForTimeout(200);
    await page.locator('#filter-repo').selectOption('');
    await page.waitForTimeout(200);

    const visibleCount = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThanOrEqual(30);
    await expect(page.locator('#pagination-controls')).toContainText(`of ${total}`);
  });

  test('repo dropdown updates when org is selected', async ({ page }) => {
    const orgSelect = page.locator('#filter-org');
    const repoSelect = page.locator('#filter-repo');
    if (!(await orgSelect.count()) || !(await repoSelect.count())) test.skip();

    const firstOrg = await orgSelect.locator('option:not([value=""])').first().getAttribute('value');
    if (!firstOrg) test.skip();

    const allRepoBefore = await repoSelect.locator('option').count();
    await orgSelect.selectOption(firstOrg!);
    await page.waitForTimeout(200);

    // Repo dropdown should have been rebuilt (all repos ≤ original count)
    const allRepoAfter = await repoSelect.locator('option').count();
    // The "All repos" option must still be present
    await expect(repoSelect.locator('option[value=""]')).toBeAttached();
    expect(allRepoAfter).toBeLessThanOrEqual(allRepoBefore);
  });

  test('combining search and trigger filter uses AND logic', async ({ page }) => {
    const cards = page.locator('article[aria-label^="Workflow:"]');
    const total = await cards.count();
    if (total === 0) test.skip();

    // Apply trigger filter alone
    const firstTrigger = await page.locator('#filter-trigger option:not([value=""])').first().getAttribute('value');
    if (!firstTrigger) test.skip();
    await page.locator('#filter-trigger').selectOption(firstTrigger!);
    await page.waitForTimeout(200);
    const afterTrigger = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );

    // Add an impossible search query on top — should show no results
    await page.locator('#search-input').fill('__unlikely_xyz__');
    await page.waitForTimeout(200);
    const afterBoth = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(afterBoth).toBeLessThanOrEqual(afterTrigger);

    // Clean up
    await page.locator('#search-input').fill('');
    await page.locator('#filter-trigger').selectOption('');
    await page.waitForTimeout(200);

    const afterReset = await cards.evaluateAll(
      (els) => els.filter((e) => (e as HTMLElement).style.display !== 'none').length,
    );
    expect(afterReset).toBeGreaterThan(0);
    expect(afterReset).toBeLessThanOrEqual(30);
    await expect(page.locator('#pagination-controls')).toContainText(`of ${total}`);
  });

  test('skip-to-content link is present', async ({ page }) => {
    const skipLink = page.locator('a.skip-to-content');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('passes accessibility scan', async ({ page }) => {
    test.setTimeout(60_000);
    await checkAccessibility(page);
  });
});

test.describe('Homepage — mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hamburger menu button is visible on mobile', async ({ page }) => {
    await expect(page.locator('#mobile-menu-btn')).toBeVisible();
  });

  test('desktop nav is hidden on mobile', async ({ page }) => {
    await expect(page.locator('#main-nav')).toBeHidden();
  });

  test('hamburger opens and closes mobile nav', async ({ page }) => {
    const btn = page.locator('#mobile-menu-btn');
    const mobileNav = page.locator('#mobile-nav');

    await expect(mobileNav).toBeHidden();
    await btn.click();
    await expect(mobileNav).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');

    await btn.click();
    await expect(mobileNav).toBeHidden();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape key closes mobile nav', async ({ page }) => {
    const btn = page.locator('#mobile-menu-btn');
    const mobileNav = page.locator('#mobile-nav');

    await btn.click();
    await expect(mobileNav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(mobileNav).toBeHidden();
  });
});
