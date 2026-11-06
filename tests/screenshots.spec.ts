import { test, expect } from '@playwright/test';
import { modern, unique } from './helpers';
import { mkdir } from 'node:fs/promises';

test('article screenshots: overview, every layer, and PPR loading/completed', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await mkdir('docs/screenshots', { recursive: true });
  const capture = async (name: string) => {
    await page.screenshot({
      path: `docs/screenshots/${name}.png`,
      fullPage: true,
    });
  };
  await page.goto(modern);
  await capture('00-overview-components');
  for (const [kind, base, path] of [
    ['use-cache', modern, '/cached'],
    ['cache-life', modern, '/lifetime'],
  ] as const) {
    await page.goto(`${base}${path}?key=${unique('shot')}`);
    const read = page.getByRole('button', {
      name: '再リクエスト',
      exact: true,
    });
    await expect(read).toBeEnabled();
    await page.getByRole('button', { name: '取得元を +100円' }).click();
    await expect(page.locator('.error')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('取得元だけを');
    await expect(read).toBeEnabled();
    await read.click();
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await capture(kind);
    if (kind === 'use-cache') {
      await page.getByRole('button', { name: 'タグを即時失効' }).click();
      await expect(page.getByRole('status')).toContainText(
        '無効化を受け付けました',
      );
      await expect(read).toBeEnabled();
      await read.click();
      await expect(page.getByTestId('display-price')).toHaveText('¥200');
      await capture('use-cache-after-invalidation');
    }
  }

  await page.goto(`${modern}/ppr`, { waitUntil: 'commit' });
  await expect(page.getByTestId('ppr-fallback')).toBeVisible();
  await capture('ppr-loading');
  await expect(page.getByTestId('ppr-dynamic')).toBeVisible();
  await capture('ppr-complete');
  // Narrow layout is a functional check; article images use the desktop viewport.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${modern}/cached?key=${unique('mobile')}`);
  await expect(
    page.getByRole('button', { name: '再リクエスト', exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
