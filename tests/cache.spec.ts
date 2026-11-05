import { test, expect } from '@playwright/test';
import { classic, modern, unique, observe, control, state } from './helpers';

test('Request Memoization: two components share one GET, next render gets a new one', async ({
  request,
}) => {
  const key = unique('memo');
  const url = `${classic}/memo?key=${key}`;
  const a = await observe(request, url);
  expect(a.samples[0].readId).toBe(a.samples[1].readId);
  expect((await state(request, classic, key)).reads).toBe(1);
  const b = await observe(request, url);
  expect(b.samples[0].readId).toBe(b.samples[1].readId);
  expect(b.samples[0].readId).not.toBe(a.samples[0].readId);
  expect(b.renderId).not.toBe(a.renderId);
  expect((await state(request, classic, key)).reads).toBe(2);
});

for (const [name, base, path] of [
  ['Data Cache', classic, 'data'],
  ['use cache', modern, 'cached'],
] as const) {
  test(`${name}: fresh render, cached data, explicit tag expiration`, async ({
    request,
  }) => {
    const key = unique(path);
    const url = `${base}/${path}?key=${key}`;
    const a = await observe(request, url);
    await control(request, base, key, 'mutate');
    const b = await observe(request, url);
    expect(b.renderId).not.toBe(a.renderId);
    expect(b.samples[0].readId).toBe(a.samples[0].readId);
    expect(b.samples[0].price).toBe(100);
    expect((await state(request, base, key)).reads).toBe(1);
    await control(request, base, key, 'expire');
    const c = await observe(request, url);
    expect(c.samples[0].price).toBe(200);
    expect(c.samples[0].readId).not.toBe(a.samples[0].readId);
    expect((await state(request, base, key)).reads).toBe(2);
  });
  test(`${name}: max profile serves stale then revalidates`, async ({
    request,
  }) => {
    const key = unique('swr');
    const url = `${base}/${path}?key=${key}`;
    await observe(request, url);
    await control(request, base, key, 'mutate');
    await control(request, base, key, 'swr');
    expect((await observe(request, url)).samples[0].price).toBe(100);
    await expect
      .poll(async () => (await observe(request, url)).samples[0].price)
      .toBe(200);
  });
}

test('use cache: arguments isolate entries and tag invalidation does not affect another key', async ({
  request,
}) => {
  const aKey = unique('arg-a'),
    bKey = unique('arg-b');
  const aUrl = `${modern}/cached?key=${aKey}`,
    bUrl = `${modern}/cached?key=${bKey}`;
  const a = await observe(request, aUrl),
    b = await observe(request, bUrl);
  expect(a.samples[0].readId).not.toBe(b.samples[0].readId);
  await control(request, modern, aKey, 'mutate');
  await control(request, modern, aKey, 'expire');
  expect((await observe(request, aUrl)).samples[0].price).toBe(200);
  expect((await observe(request, bUrl)).samples[0].readId).toBe(
    b.samples[0].readId,
  );
  expect((await state(request, modern, bKey)).reads).toBe(1);
});

test('Full Route Cache: render ID is reused; path invalidation regenerates the route', async ({
  request,
}) => {
  const url = `${classic}/full-route`;
  const a = await observe(request, url);
  const before = await state(request, classic, a.key);
  await control(request, classic, a.key, 'mutate');
  const b = await observe(request, url);
  expect(b.renderId).toBe(a.renderId);
  expect(b.samples[0].readId).toBe(a.samples[0].readId);
  expect((await state(request, classic, a.key)).reads).toBe(before.reads);
  await control(request, classic, a.key, 'path');
  await expect
    .poll(async () => (await observe(request, url)).renderId)
    .not.toBe(a.renderId);
  await expect
    .poll(async () => (await observe(request, url)).samples[0].price)
    .toBe(before.price + 100);
});

test('cacheLife: production default handler drops timed-stale entries and refetches on access', async ({
  request,
}) => {
  const swrKey = unique('life-swr'),
    expiredKey = unique('life-expire');
  const swrUrl = `${modern}/lifetime?key=${swrKey}`,
    expiredUrl = `${modern}/lifetime?key=${expiredKey}`;
  await observe(request, swrUrl);
  await observe(request, expiredUrl);
  await control(request, modern, swrKey, 'mutate');
  await control(request, modern, expiredKey, 'mutate');
  expect((await observe(request, swrUrl)).samples[0].price).toBe(100);
  // Real time on the production server, not a fake clock in the test runner.
  await new Promise((resolve) => setTimeout(resolve, 5600));
  expect((await state(request, modern, swrKey)).reads).toBe(1);
  expect((await observe(request, swrUrl)).samples[0].price).toBe(200);
  expect((await state(request, modern, swrKey)).reads).toBe(2);
  await new Promise((resolve) => setTimeout(resolve, 5200));
  expect((await state(request, modern, expiredKey)).reads).toBe(1);
  expect((await observe(request, expiredUrl)).samples[0].price).toBe(200);
});

test('Router Cache: back reuses A without an RSC request; refresh fetches again', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const requests: string[] = [];
  page.on('request', (req) => {
    if (req.headers()['rsc'] === '1') requests.push(req.url());
  });
  await page.goto('/router/a');
  const initial = await page.getByTestId('router-render-id').textContent();
  await page.getByRole('link', { name: 'ページBへ' }).click();
  await expect(page.getByTestId('router-page')).toHaveText('ページB');
  const beforeBack = requests.length;
  await page.getByRole('button', { name: '戻る', exact: true }).click();
  await expect(page.getByTestId('router-page')).toHaveText('ページA');
  await expect(page.getByTestId('router-render-id')).toHaveText(initial!);
  expect(requests.length).toBe(beforeBack);
  await page.getByRole('button', { name: 'router.refresh()' }).click();
  await expect(page.getByTestId('router-render-id')).not.toHaveText(initial!);
  expect(requests.length).toBeGreaterThan(beforeBack);
  expect(errors).toEqual([]);
});

test('PPR: static shell and fallback arrive before dynamic data; cached ID survives reload', async ({
  page,
}) => {
  await page.goto(`${modern}/ppr`, { waitUntil: 'commit' });
  await expect(page.getByTestId('ppr-shell')).toBeVisible();
  await expect(page.getByTestId('ppr-fallback')).toBeVisible();
  await expect(page.getByTestId('ppr-dynamic')).toBeVisible();
  const cachedId = await page.getByTestId('ppr-cached-id').textContent();
  const dynamicId = await page.getByTestId('ppr-dynamic-id').textContent();
  await page.reload();
  await expect(page.getByTestId('ppr-cached-id')).toHaveText(cachedId!);
  await expect(page.getByTestId('ppr-dynamic-id')).not.toHaveText(dynamicId!);
});

test('control API rejects invalid requests and cross-origin writes', async ({
  request,
}) => {
  expect(
    (
      await request.post(`${classic}/api/control`, {
        data: { key: '../bad', action: 'mutate' },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(`${classic}/api/control`, {
        data: { key: 'valid', action: 'unknown' },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(`${classic}/api/control`, {
        headers: { origin: 'https://example.com' },
        data: { key: 'valid', action: 'mutate' },
      })
    ).status(),
  ).toBe(403);
});
