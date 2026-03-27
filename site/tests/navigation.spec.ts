import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('skip-to-content link skips to main on Enter', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a.skip-to-content');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    // After skip, focus should be in or near main
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();
  });

  test('logo link is keyboard focusable', async ({ page }) => {
    await page.goto('/');
    // Tab once to skip-link, twice to logo
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const logoLink = page.locator('header a[href]').first();
    await expect(logoLink).toBeFocused();
  });

  test('navigates to org page from home', async ({ page }) => {
    await page.goto('/');
    const orgCard = page.locator('[aria-label^="View "]').first();
    if (!(await orgCard.count())) test.skip();
    const orgName = (await orgCard.getAttribute('aria-label'))?.match(/View (\S+)/)?.[1] ?? '';
    await orgCard.click();
    await expect(page).toHaveURL(new RegExp(orgName));
    await expect(page.locator('h1')).toContainText(orgName);
  });

  test('breadcrumb Home link navigates back', async ({ page }) => {
    await page.goto('/');
    const orgCard = page.locator('[aria-label^="View "]').first();
    if (!(await orgCard.count())) test.skip();
    await orgCard.click();
    const homeLink = page.locator('nav[aria-label="Breadcrumb"] a', { hasText: 'Home' });
    await homeLink.click();
    await expect(page).toHaveURL('/');
  });

  test('footer GitHub link opens in new tab', async ({ page }) => {
    await page.goto('/');
    const footerLink = page.locator('footer a[target="_blank"]');
    await expect(footerLink).toBeVisible();
    await expect(footerLink.locator('.sr-only')).toContainText('opens in new tab');
    await expect(footerLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

test.describe('Navigation — mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile nav links navigate correctly', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#mobile-menu-btn');
    await btn.click();
    const mobileNav = page.locator('#mobile-nav');
    await expect(mobileNav).toBeVisible();

    const firstLink = mobileNav.locator('a').first();
    if (!(await mobileNav.locator('a').count())) test.skip();
    const href = await firstLink.getAttribute('href');
    await firstLink.click();
    if (href) {
      await expect(page).toHaveURL(new RegExp(href.replace(/[/]/g, '\\/')));
    }
  });
});
