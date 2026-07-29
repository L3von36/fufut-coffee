/**
 * Cloudflare Pages Function — API proxy
 * Forwards all /api/* requests to the Worker server-side,
 * avoiding CORS entirely since the browser talks same-origin.
 */
const WORKER_BASE = 'https://fufut-api.fufutcoffee.workers.dev';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = WORKER_BASE + url.pathname + url.search;

  const req = new Request(target, {
    method: context.request.method,
    headers: context.request.headers,
    body: ['GET', 'HEAD'].includes(context.request.method)
      ? undefined
      : context.request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(req);
    // Strip any CORS headers from the Worker — not needed for same-origin
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
    return new Response(JSON.stringify({ ok: false, error: 'API unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
