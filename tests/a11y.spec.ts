import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pages are served relative to baseURL (which already includes the /site base).
const pages = [
  { name: 'home', path: '' },
  { name: 'demos', path: 'demos' },
  { name: 'about', path: 'about' },
  { name: 'post', path: 'blog/tls-handshake-explained' },
];

for (const { name, path } of pages) {
  test.describe(name, () => {
    test(`has no detectable a11y violations (light)`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    test(`has no detectable a11y violations (dark)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
}

test('skip link is the first focusable element and targets main', async ({ page }) => {
  await page.goto('');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveText(/skip to content/i);
  await expect(focused).toHaveAttribute('href', '#main');
});

test('theme toggle flips and persists the theme', async ({ page }) => {
  await page.goto('');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.getByRole('button', { name: /switch color theme/i }).click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after!);
});

test('stepper responds to arrow keys', async ({ page }) => {
  await page.goto('demos');
  const stepper = page.locator('#demo-stepper');
  await stepper.scrollIntoViewIfNeeded();
  await expect(stepper).toBeVisible();
  // Wait for hydration before driving the keyboard.
  await expect(stepper).toHaveClass(/is-interactive/);
  const counter = stepper.locator('.stepper__count');
  await expect(counter).toContainText(/step\s*1/i);
  await stepper.focus();
  await page.keyboard.press('ArrowRight');
  await expect(counter).toContainText(/step\s*2/i);
});
