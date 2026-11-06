import { expect, type APIRequestContext } from '@playwright/test';
import type { Observation } from '../shared/data';
export const modern = 'http://127.0.0.1:3201';
export const unique = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export async function observe(
  request: APIRequestContext,
  url: string,
): Promise<Observation> {
  const response = await request.get(url);
  expect(response.ok(), await response.text()).toBeTruthy();
  const html = await response.text();
  const match = html.match(
    /<script id="observation" type="application\/json">([^<]+)<\/script>/,
  );
  expect(match, 'Server HTML includes the real observation').toBeTruthy();
  return JSON.parse(match![1]);
}
export async function control(
  request: APIRequestContext,
  base: string,
  key: string,
  action: string,
) {
  const response = await request.post(`${base}/api/control`, {
    data: { key, action },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}
export async function state(
  request: APIRequestContext,
  base: string,
  key: string,
) {
  const response = await request.get(`${base}/api/control?key=${key}`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}
