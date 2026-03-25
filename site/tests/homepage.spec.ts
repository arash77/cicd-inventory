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
    await expect(page.locator('h1')).toContainText('CI/CD Workflow Inventory');
  });

  test('renders 3 stat cards', async ({ page }) => {
    const statCards = page.locator('.grid > div').filter({ hasText: /Workflows|Repositories|Organizations/ });
    await expect(statCards).toHaveCount(3);
  });

  test('renders org summary cards', async ({ page }) => {
    const orgCards = page.locator('[aria-label^="View "]');
    await expect(orgCards.first()).toBeVisible();
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

  test('skip-to-content link is present', async ({ page }) => {
    const skipLink = page.locator('a.skip-to-content');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('passes accessibility scan', async ({ page }) => {
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
