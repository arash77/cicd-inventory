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
    await expect(page.locator('h1')).toBeVisible();
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

  test('passes accessibility scan', async ({ page }) => {
    await checkAccessibility(page);
  });
});
