import { cacheLife, cacheTag } from 'next/cache';
import { readSource, tag } from '../../../shared/data';
export async function cachedProduct(key: string) {
  'use cache';
  cacheLife({ stale: 300, revalidate: 3600, expire: 7200 });
  cacheTag(tag(key));
  return readSource(key, { cache: 'no-store' });
}
export async function shortLivedProduct(key: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 5, expire: 10 });
  cacheTag(tag(key));
  return readSource(key, { cache: 'no-store' }, 300);
}
