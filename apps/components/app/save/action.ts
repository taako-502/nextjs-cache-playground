'use server';
import { updateTag } from 'next/cache';
import { origin, tag, validKey, type Sample } from '../../../../shared/data';
import { cachedProduct } from '../../lib/cached';

export type SaveResult =
  | { before: Sample; after: Sample }
  | { error: string }
  | null;
export async function savePrice(
  key: string,
  _previous: SaveResult,
  form: FormData,
): Promise<SaveResult> {
  const raw = form.get('price');
  if (
    !validKey(key) ||
    !key.startsWith('save-') ||
    typeof raw !== 'string' ||
    !/^\d+$/.test(raw) ||
    Number(raw) > 1000000
  )
    return { error: '0〜1,000,000の整数を入力してください。' };
  const before = await cachedProduct(key);
  const response = await fetch(`${origin}/price?key=${key}&price=${raw}`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (!response.ok) return { error: '保存できませんでした。' };
  updateTag(tag(key));
  const after = await cachedProduct(key);
  return { before, after };
}
