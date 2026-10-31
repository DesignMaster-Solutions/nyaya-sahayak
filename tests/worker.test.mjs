import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { Counter } from '../worker.js';

class FakeStorage {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.get(k); }
  async put(k, v) { this.m.set(k, v); }
  async list() { return new Map(this.m); }
}
const counter = () => new Counter({ storage: new FakeStorage() });
const post = (body) => new Request('https://x/api/event', { method: 'POST', body });
const stats = async (c) => (await (await c.fetch(new Request('https://x/api/stats'))).json()).counts;

test('a valid event is counted in total, per language and per day', async () => {
  const c = counter();
  assert.equal((await c.fetch(post(JSON.stringify({ event: 'check', lang: 'hi' })))).status, 204);
  assert.equal((await c.fetch(post(JSON.stringify({ event: 'check', lang: 'hi' })))).status, 204);
  const s = await stats(c);
  assert.equal(s['total:check'], 2);
  assert.equal(s['lang:hi:check'], 2);
  assert.equal(s[`day:${new Date().toISOString().slice(0, 10)}:check`], 2);
});

test('unknown events, languages and broken JSON are rejected and not stored', async () => {
  const c = counter();
  assert.equal((await c.fetch(post(JSON.stringify({ event: 'name', lang: 'en' })))).status, 400);
  assert.equal((await c.fetch(post(JSON.stringify({ event: 'check', lang: 'xx' })))).status, 400);
  assert.equal((await c.fetch(post('{not json'))).status, 400);
  assert.deepEqual(await stats(c), {});
});

test('the worker routes /api/* to the counter and everything else to the static assets', async () => {
  const seen = [];
  const env = {
    ASSETS: { fetch: async (r) => { seen.push(new URL(r.url).pathname); return new Response('asset'); } },
    COUNTER: { idFromName: (n) => n, get: () => counter() },
  };
  assert.equal(await (await worker.fetch(new Request('https://x/'), env)).text(), 'asset');
  assert.equal(await (await worker.fetch(new Request('https://x/stats'), env)).text(), 'asset');
  assert.equal((await worker.fetch(new Request('https://x/api/stats'), env)).status, 200);
  assert.equal((await worker.fetch(post(JSON.stringify({ event: 'draft', lang: 'en' })), env)).status, 204);
  assert.equal((await worker.fetch(new Request('https://x/api/event'), env)).status, 405);
  assert.deepEqual(seen, ['/', '/stats']);
});
