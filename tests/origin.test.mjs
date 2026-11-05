import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrigin } from '../scripts/origin.mjs';

test('instrumentation counts only reads, isolates keys, and mutates without fetching', async () => {
  const server = createOrigin();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const json = async (path, method = 'GET') =>
    (await fetch(url + path, { method })).json();
  try {
    assert.equal((await json('/state?key=a')).reads, 0);
    const a = await json('/read?key=a');
    assert.equal(a.reads, 1);
    assert.equal((await json('/state?key=a')).reads, 1);
    await json('/mutate?key=a', 'POST');
    assert.equal((await json('/state?key=a')).reads, 1);
    const b = await json('/read?key=a');
    assert.equal(b.price, 200);
    assert.notEqual(a.readId, b.readId);
    assert.equal((await json('/read?key=b')).price, 100);
    assert.equal((await fetch(url + '/read?key=../bad')).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
