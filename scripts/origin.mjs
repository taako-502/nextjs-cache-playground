import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// This process is the data source, not a replacement for Next.js's caches.
export function createOrigin() {
  const records = new Map();
  const get = (key) => {
    if (!records.has(key))
      records.set(key, { price: 100, revision: 1, reads: 0 });
    return records.get(key);
  };
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const key = url.searchParams.get('key') || 'default';
    const send = (status, value) => {
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify(value));
    };
    if (url.pathname === '/health') return send(200, { ok: true });
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(key))
      return send(400, { error: 'Invalid key' });
    const record = get(key);
    if (req.method === 'GET' && url.pathname === '/state')
      return send(200, { key, ...record });
    if (req.method === 'POST' && url.pathname === '/mutate') {
      record.price += 100;
      record.revision += 1;
      return send(200, { key, ...record });
    }
    if (req.method === 'GET' && url.pathname === '/read') {
      record.reads += 1;
      const value = {
        key,
        ...record,
        readId: randomUUID(),
        readAt: new Date().toISOString(),
      };
      // Delay makes streaming / background revalidation observable, not probabilistic.
      const delay = Math.min(
        3200,
        Math.max(0, Number(url.searchParams.get('delay')) || 0),
      );
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      return send(200, value);
    }
    send(404, { error: 'Not found' });
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  createOrigin().listen(
    Number(process.env.ORIGIN_PORT || 4200),
    '127.0.0.1',
    () => console.log('Origin: http://127.0.0.1:4200'),
  );
}
