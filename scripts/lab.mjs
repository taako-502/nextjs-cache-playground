import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { rm } from 'node:fs/promises';

const root = fileURLToPath(new URL('..', import.meta.url));
const next = resolve(root, 'node_modules/next/dist/bin/next');
const dev = process.argv.includes('--dev');
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
function start(args, cwd = root, build = false) {
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
      ORIGIN_URL: 'http://127.0.0.1:4200',
    },
  });
  children.add(child);
  child.on('exit', (code) => {
    children.delete(child);
    if (!stopping && !build) stop(code || 1);
  });
  return child;
}
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    if (stopping) throw new Error('A service exited');
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Service did not start: ${url}`);
}
try {
  // Refuse to reuse unknown servers; every run gets an isolated origin and builds.
  for (const port of [4200, 3201]) {
    try {
      await fetch(`http://127.0.0.1:${port}`, {
        signal: AbortSignal.timeout(500),
      });
    } catch {
      continue;
    }
    throw new Error(
      `Port ${port} is already in use. Stop the existing lab first.`,
    );
  }
  start(['scripts/origin.mjs']);
  await ready('http://127.0.0.1:4200/health');
  const port = '3201';
  const cwd = resolve(root, 'apps/components');
  if (!dev) {
    await rm(resolve(cwd, '.next'), { recursive: true, force: true });
    const child = start([next, 'build'], cwd, true);
    await new Promise((resolve, reject) =>
      child.on('exit', (code) =>
        code === 0 ? resolve() : reject(new Error('Next.js build failed')),
      ),
    );
  }
  if (stopping) throw new Error('Lab stopped');
  start(
    [next, dev ? 'dev' : 'start', '--hostname', '127.0.0.1', '--port', port],
    cwd,
  );
  await ready(`http://127.0.0.1:${port}`);
  if (!stopping) console.log('\nCache lab ready: http://localhost:3201\n');
} catch (error) {
  console.error(error);
  stop(1);
}
