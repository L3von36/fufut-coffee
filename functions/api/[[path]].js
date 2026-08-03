/**
 * Cloudflare Pages Function — API router
 *
 * Handles CMS content endpoints locally (KV-backed):
 *   GET  /api/content
 *   GET  /api/content?draft=true
 *   GET  /api/content?preview=true
 *   GET  /api/content/status
 *   GET  /api/content/versions
 *   GET  /api/content/versions/:id
 *   POST /api/content/draft
 *   POST /api/content/publish
 *   POST /api/content/schedule
 *   POST /api/content/discard
 *   POST /api/content/rollback/:id
 *   POST /api/content/save-and-publish
 *   POST /api/save-content          (legacy — publishes immediately)
 *
 * All other /api/* requests are proxied to the Worker at WORKER_BASE.
 */
const WORKER_BASE = 'https://fufut-api.fufutcoffee.workers.dev';

const CONTENT_KV = 'CONTENT_KV';
const CONTENT_KEY = 'site:content';
const DRAFT_KEY = 'site:content:draft';
const VERSIONS_KEY = 'site:content:versions';
const MAX_VERSIONS = 50;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stripMeta(content) {
  if (!content || typeof content !== 'object') return content;
  const clean = {};
  for (const k of Object.keys(content)) {
    if (!k.startsWith('_')) clean[k] = content[k];
  }
  return clean;
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function now() {
  return new Date().toISOString();
}

function versionId() {
  return 'v' + crypto.randomUUID().slice(0, 8);
}

// === VERSION HELPERS (KV-backed) ===

async function getVersions(env) {
  try {
    const raw = await env[CONTENT_KV].get(VERSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveVersions(env, versions) {
  await env[CONTENT_KV].put(VERSIONS_KEY, JSON.stringify(versions));
}

async function createVersion(env, content, note) {
  const versions = await getVersions(env);
  const entry = {
    id: versionId(),
    timestamp: now(),
    note: note || 'Manual save',
    status: 'published',
    content: content,
  };
  versions.push(entry);
  // Keep last N versions
  if (versions.length > MAX_VERSIONS) {
    versions.splice(0, versions.length - MAX_VERSIONS);
  }
  await saveVersions(env, versions);
  return entry.id;
}

// === SCHEDULED PUBLISH CHECK ===

async function checkScheduledPublish(env) {
  try {
    const raw = await env[CONTENT_KV].get(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    const scheduled = draft._meta && draft._meta.scheduled_at;
    if (!scheduled) return;
    const scheduledDt = new Date(scheduled);
    if (new Date() >= scheduledDt) {
      const clean = stripMeta(draft);
      await env[CONTENT_KV].put(CONTENT_KEY, JSON.stringify(clean));
      await createVersion(env, clean, 'Scheduled auto-publish');
      await env[CONTENT_KV].delete(DRAFT_KEY);
    }
  } catch (e) {
    console.error('[AUTO-PUBLISH ERROR]', e);
  }
}

// === CMS ROUTER ===

async function handleCmsRequest(pathname, url, request, env) {
  const method = request.method;

  // GET /api/content
  if (pathname === '/api/content' && method === 'GET') {
    const params = url.searchParams;
    const isDraft = params.get('draft') === 'true' || params.get('preview') === 'true';

    if (isDraft) {
      const raw = await env[CONTENT_KV].get(DRAFT_KEY);
      if (raw) return json(stripMeta(JSON.parse(raw)));
      // No draft — fall through to published
    }

    // Check scheduled publish on normal requests
    await checkScheduledPublish(env);

    const raw = await env[CONTENT_KV].get(CONTENT_KEY);
    return json(raw ? stripMeta(JSON.parse(raw)) : {});
  }

  // GET /api/content/status
  if (pathname === '/api/content/status' && method === 'GET') {
    const draftRaw = await env[CONTENT_KV].get(DRAFT_KEY);
    const pubRaw = await env[CONTENT_KV].get(CONTENT_KEY);
    const hasDraft = !!draftRaw;
    let draftMeta = {}, pubMeta = {};
    try { draftMeta = JSON.parse(draftRaw)._meta || {}; } catch {}
    try { pubMeta = JSON.parse(pubRaw)._meta || {}; } catch {}
    return json({
      hasDraft,
      draftModified: draftMeta.updated_at || '',
      publishedModified: pubMeta.updated_at || '',
      scheduledAt: draftMeta.scheduled_at || null,
      hasUnpublishedChanges: hasDraft,
    });
  }

  // GET /api/content/versions
  if (pathname === '/api/content/versions' && method === 'GET') {
    const versions = await getVersions(env);
    // Return lite list (without full content payloads for speed)
    const lite = versions.slice().reverse().map(v => ({
      id: v.id,
      timestamp: v.timestamp,
      note: v.note,
      status: v.status,
    }));
    return json(lite);
  }

  // GET /api/content/versions/:id
  if (pathname.startsWith('/api/content/versions/') && method === 'GET') {
    const vid = pathname.split('/').pop();
    const versions = await getVersions(env);
    for (let i = versions.length - 1; i >= 0; i--) {
      if (versions[i].id === vid) {
        return json({
          id: versions[i].id,
          timestamp: versions[i].timestamp,
          note: versions[i].note,
          status: versions[i].status,
          content: stripMeta(versions[i].content),
        });
      }
    }
    return json({ ok: false, error: 'Version not found' }, 404);
  }

  // POST /api/content/draft
  if (pathname === '/api/content/draft' && method === 'POST') {
    const data = await readBody(request);
    if (!data) return json({ ok: false, error: 'Invalid JSON body' }, 400);
    data._meta = {
      updated_at: now(),
      status: 'draft',
      scheduled_at: data._scheduled_at || null,
    };
    delete data._scheduled_at;
    await env[CONTENT_KV].put(DRAFT_KEY, JSON.stringify(data));
    return json({ ok: true, message: 'Draft saved' });
  }

  // POST /api/content/publish
  if (pathname === '/api/content/publish' && method === 'POST') {
    const draftRaw = await env[CONTENT_KV].get(DRAFT_KEY);
    if (!draftRaw) return json({ ok: false, error: 'No draft to publish' }, 400);
    const clean = stripMeta(JSON.parse(draftRaw));
    await env[CONTENT_KV].put(CONTENT_KEY, JSON.stringify(clean));
    const vid = await createVersion(env, clean, 'Published from draft');
    await env[CONTENT_KV].delete(DRAFT_KEY);
    return json({ ok: true, version: vid, message: 'Content published' });
  }

  // POST /api/content/schedule
  if (pathname === '/api/content/schedule' && method === 'POST') {
    const data = await readBody(request);
    const scheduled_at = data && data.scheduled_at;
    if (!scheduled_at) return json({ ok: false, error: 'scheduled_at is required' }, 400);
    try { new Date(scheduled_at); } catch {
      return json({ ok: false, error: 'Invalid datetime format' }, 400);
    }
    const draftRaw = await env[CONTENT_KV].get(DRAFT_KEY);
    if (!draftRaw) return json({ ok: false, error: 'No draft to schedule. Save a draft first.' }, 400);
    const draft = JSON.parse(draftRaw);
    draft._meta = draft._meta || {};
    draft._meta.scheduled_at = scheduled_at;
    draft._meta.status = 'scheduled';
    await env[CONTENT_KV].put(DRAFT_KEY, JSON.stringify(draft));
    return json({ ok: true, message: 'Scheduled for ' + scheduled_at });
  }

  // POST /api/content/discard
  if (pathname === '/api/content/discard' && method === 'POST') {
    await env[CONTENT_KV].delete(DRAFT_KEY);
    return json({ ok: true, message: 'Draft discarded' });
  }

  // POST /api/content/rollback/:id
  if (pathname.startsWith('/api/content/rollback/') && method === 'POST') {
    const vid = pathname.split('/').pop();
    const versions = await getVersions(env);
    for (const v of versions) {
      if (v.id === vid) {
        const clean = stripMeta(v.content);
        await env[CONTENT_KV].put(CONTENT_KEY, JSON.stringify(clean));
        const newVid = await createVersion(env, clean, 'Rollback to ' + vid);
        await env[CONTENT_KV].delete(DRAFT_KEY);
        return json({ ok: true, version: newVid, message: 'Rolled back to ' + vid });
      }
    }
    return json({ ok: false, error: 'Version not found' }, 404);
  }

  // POST /api/content/save-and-publish
  if (pathname === '/api/content/save-and-publish' && method === 'POST') {
    const data = await readBody(request);
    if (!data) return json({ ok: false, error: 'Invalid JSON body' }, 400);
    const clean = stripMeta(data);
    await env[CONTENT_KV].put(CONTENT_KEY, JSON.stringify(clean));
    const vid = await createVersion(env, clean, 'Save & Publish');
    await env[CONTENT_KV].delete(DRAFT_KEY);
    return json({ ok: true, version: vid, message: 'Saved and published' });
  }

  // POST /api/save-content (legacy — publishes immediately)
  if ((pathname === '/api/save-content' || pathname === '/save-content') && method === 'POST') {
    const data = await readBody(request);
    if (!data) return json({ ok: false, error: 'Invalid JSON body' }, 400);
    const clean = stripMeta(data);
    await env[CONTENT_KV].put(CONTENT_KEY, JSON.stringify(clean));
    const vid = await createVersion(env, clean, 'Save (legacy)');
    return json({ ok: true, version: vid });
  }

  // Not a CMS endpoint — return null to signal "proxy to Worker"
  return null;
}

// === MAIN HANDLER ===

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Try CMS handler first
  const cmsResult = await handleCmsRequest(pathname, url, request, env);
  if (cmsResult !== null) return cmsResult;

  // Fall through to proxy for non-CMS endpoints
  const target = WORKER_BASE + pathname + url.search;

  const req = new Request(target, {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method)
      ? undefined
      : request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(req);
    const headers = new Headers(response.headers);
    headers.delete('access-control-allow-origin');
    headers.delete('access-control-allow-credentials');
    headers.delete('access-control-allow-methods');
    headers.delete('access-control-allow-headers');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    return json({ ok: false, error: 'API unavailable' }, 502);
  }
}
