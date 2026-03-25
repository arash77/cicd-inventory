import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export async function checkAccessibility(page: Page, disableRules: string[] = []) {
  const builder = new AxeBuilder({ page });
  if (disableRules.length > 0) {
    builder.disableRules(disableRules);
  }
  const results = await builder.analyze();
  expect(results.violations).toEqual([]);
}
