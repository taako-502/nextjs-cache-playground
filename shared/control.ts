import { revalidatePath, revalidateTag } from 'next/cache';
import { origin, tag, validKey } from './data';

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!validKey(key))
    return Response.json({ error: 'Invalid key' }, { status: 400 });
  const response = await fetch(`${origin}/state?key=${key}`, {
    cache: 'no-store',
  });
  return Response.json(await response.json(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
export async function POST(request: Request) {
  // Local lab mutations must not accept cross-origin requests.
  const site = request.headers.get('sec-fetch-site');
  const originHeader = request.headers.get('origin');
  let sameHost = true;
  try {
    if (originHeader)
      sameHost = new URL(originHeader).host === request.headers.get('host');
  } catch {
    sameHost = false;
  }
  if (site === 'cross-site' || !sameHost) {
    return Response.json(
      { error: 'Cross-origin mutation rejected' },
      { status: 403 },
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { key, action } = body || {};
  if (typeof key !== 'string' || !validKey(key))
    return Response.json({ error: 'Invalid key' }, { status: 400 });
  if (action === 'mutate') {
    const response = await fetch(`${origin}/mutate?key=${key}`, {
      method: 'POST',
      cache: 'no-store',
    });
    return Response.json(await response.json());
  }
  if (action === 'expire') revalidateTag(tag(key), { expire: 0 });
  else if (action === 'swr') revalidateTag(tag(key), 'max');
  else if (action === 'path') revalidatePath('/full-route');
  else return Response.json({ error: 'Unknown action' }, { status: 400 });
  return Response.json({ ok: true });
}
