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

test('save returns a fresh cached read in one Server Action', async ({
  page,
  request,
}) => {
  const key = unique('save');
  await page.goto(`${modern}/save?key=${key}`);
  const price = page.getByRole('spinbutton');
  await price.fill('250');
  const documents: string[] = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'document') documents.push(r.url());
  });
  await page.screenshot({
    path: 'docs/screenshots/save-before.png',
    fullPage: true,
  });
  const action = page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' && !!r.request().headers()['next-action'],
  );
  await page.getByRole('button', { name: '保存', exact: true }).click();
  expect((await action).ok()).toBeTruthy();
  await expect(page.getByTestId('saved-price')).toHaveText('¥250');
  const state = await request.get(`${modern}/api/control?key=${key}`);
  const actual = await state.json();
  expect(actual.reads).toBeGreaterThanOrEqual(2);
  expect(actual).toMatchObject({
    price: 250,
    revision: 2,
  });
  expect(documents).toEqual([]);
  await page.screenshot({
    path: 'docs/screenshots/save-after.png',
    fullPage: true,
  });
});

test('Link prefetches the static detail, click loads its price, back reuses the list', async ({
  page,
  request,
}) => {
  const reads = async (key: string) =>
    (await (await request.get(`${modern}/api/control?key=${key}`)).json())
      .reads;
  const before = await reads('nav-detail');
  const responses = page.waitForResponse(
    (r) =>
      r.url().includes('/navigation/detail') &&
      r.request().headers()['rsc'] === '1' &&
      r.request().headers()['next-router-prefetch'] !== undefined,
  );
  await page.goto(`${modern}/navigation`);
  const initial = await page
    .getByTestId('nav-id')
    .filter({ visible: true })
    .innerText();
  const prefetched = await responses;
  expect(prefetched.ok()).toBeTruthy();
  expect(await reads('nav-detail')).toBe(before);
  await expect(page.locator('.reading-guide')).toContainText(
    '/navigation/detail',
  );
  const dynamic = page.waitForResponse(
    (r) =>
      r.url().includes('/navigation/detail') &&
      r.request().headers()['rsc'] === '1' &&
      r.request().headers()['next-router-prefetch'] === undefined,
  );
  await page.getByRole('link', { name: '商品詳細へ' }).click();
  await dynamic;
  await expect(
    page.getByTestId('nav-id').filter({ visible: true }),
  ).not.toHaveText(initial);
  expect(await reads('nav-detail')).toBe(before + 1);
  const listReads = await reads('nav-list');
  await page.getByRole('button', { name: '一覧に戻る（履歴）' }).click();
  await expect(page.getByRole('heading', { name: '商品一覧' })).toBeVisible();
  await expect(page.getByTestId('nav-id').filter({ visible: true })).toHaveText(
    initial,
  );
  expect(await reads('nav-list')).toBe(listReads);
  await expect(
    page.locator('.reading-guide table').first().locator('tbody tr'),
  ).toHaveCount(3);
  await page.screenshot({
    path: 'docs/screenshots/navigation-back.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: '再読み込み', exact: true }).click();
  await expect(
    page.getByTestId('nav-id').filter({ visible: true }),
  ).not.toHaveText(initial);
  expect(await reads('nav-list')).toBe(listReads + 1);
});
