import { test, expect } from '@playwright/test';
import { checkAccessibility } from './helpers/axe';

test.describe('Repo page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to the first workflow card's detail page (internal link, not external GitHub links)
    const workflowCard = page.locator('article[aria-label^="Workflow:"] a:not([target="_blank"])').first();
    const count = await workflowCard.count();
    if (count === 0) {
      test.skip();
      return;
    }
    const href = await workflowCard.getAttribute('href');
    if (!href) {
      test.skip();
      return;
    }
    await page.goto(href);
  });

  test('has breadcrumb with Home and org links', async ({ page }) => {
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    const links = breadcrumb.locator('a');
    await expect(links).toHaveCount(2); // Home + org
  });

  test('has h1 repo heading with external link and sr-only text', async ({ page }) => {
    const h1 = page.locator('#main-content h1');
    await expect(h1).toBeVisible();
    const repoLink = h1.locator('a[target="_blank"]');
    await expect(repoLink).toBeVisible();
    // sr-only text for screen readers
    const srOnly = repoLink.locator('.sr-only');
    await expect(srOnly).toContainText('opens in new tab');
  });

  test('workflow path link has sr-only "opens in new tab" text', async ({ page }) => {
    const pathLinks = page.locator('a[target="_blank"].font-mono');
    const count = await pathLinks.count();
    if (count === 0) test.skip();
    for (let i = 0; i < count; i++) {
      const srOnly = pathLinks.nth(i).locator('.sr-only');
      await expect(srOnly).toContainText('opens in new tab');
    }
  });

  test('trigger pills have role="list" and role="listitem"', async ({ page }) => {
    const triggerList = page.locator('[role="list"][aria-label="Triggers"]').first();
    if (!(await triggerList.count())) test.skip();
    await expect(triggerList).toBeVisible();
    const items = triggerList.locator('[role="listitem"]');
    await expect(items.first()).toBeVisible();
  });

  test('details/summary YAML toggle works', async ({ page }) => {
    const summary = page.locator('summary').first();
    if (!(await summary.count())) test.skip();
    const details = page.locator('details').first();
    // Initially closed
    const yamlBlock = details.locator('pre.yaml-block');
    await summary.click();
    await expect(yamlBlock).toBeVisible();
  });

  test('copy button exists for each workflow', async ({ page }) => {
    const copyBtns = page.locator('button.yaml-copy-btn');
    const detailsCount = await page.locator('details').count();
    if (detailsCount === 0) test.skip();
    await expect(copyBtns).toHaveCount(detailsCount);
  });

  test('badge images have lazy loading and dimensions', async ({ page }) => {
    const badges = page.locator('img[alt$=" status"]');
    const count = await badges.count();
    if (count === 0) test.skip();
    for (let i = 0; i < count; i++) {
      await expect(badges.nth(i)).toHaveAttribute('loading', 'lazy');
      await expect(badges.nth(i)).toHaveAttribute('width', '220');
      await expect(badges.nth(i)).toHaveAttribute('height', '20');
    }
  });

  test('aria-label is on summary, not details', async ({ page }) => {
    const detailsWithLabel = page.locator('details[aria-label]');
    await expect(detailsWithLabel).toHaveCount(0);
    const summaryWithLabel = page.locator('summary[aria-label]');
    await expect(summaryWithLabel.first()).toBeAttached();
  });

  test('passes accessibility scan', async ({ page }) => {
    await checkAccessibility(page);
  });
});
