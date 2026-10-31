// Anonymous usage counter for the impact data: it counts events, never answers, names or IPs.
// One Durable Object holds the counts, so increments are atomic. GET /api/stats is public.
const EVENTS = new Set(['check', 'eligible', 'draft', 'share']);
const LANGS = new Set(['en', 'hi']);

export class Counter {
  constructor(state) { this.storage = state.storage; }

  async fetch(req) {
    if (req.method === 'POST') {
      let body;
      try { body = JSON.parse(await req.text()); } catch { return new Response('bad json', { status: 400 }); }
      if (!EVENTS.has(body?.event) || !LANGS.has(body?.lang)) return new Response('bad event', { status: 400 });
      const day = new Date().toISOString().slice(0, 10);
      for (const k of [`total:${body.event}`, `lang:${body.lang}:${body.event}`, `day:${day}:${body.event}`]) {
        await this.storage.put(k, ((await this.storage.get(k)) || 0) + 1);
      }
      return new Response(null, { status: 204 });
    }
    const counts = Object.fromEntries(await this.storage.list());
    return Response.json({ since: '2026-10-31', counts }, { headers: { 'cache-control': 'no-store' } });
  }
}

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/event' || pathname === '/api/stats') {
      const wanted = pathname === '/api/event' ? 'POST' : 'GET';
      if (req.method !== wanted) return new Response(null, { status: 405 });
      return env.COUNTER.get(env.COUNTER.idFromName('global')).fetch(req);
    }
    return env.ASSETS.fetch(req);
  },
};
