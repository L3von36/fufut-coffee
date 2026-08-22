/**
 * Cloudflare Pages Function — AI Chat Assistant
 *
 * POST /api/ai-chat
 * Uses Cloudflare Workers AI (Llama 3.1 8B Instruct) to answer questions
 * about Fu Fut Coffee.
 *
 * Supports two modes:
 *   1. env.AI binding (preferred) — enable in Dashboard > Functions > AI
 *   2. REST API fallback — uses CF_API_TOKEN and CF_ACCOUNT_ID env vars
 */

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `You are the friendly AI assistant for Fu Fut Coffee (ፉ ፉት ኮፊ), an authentic Ethiopian coffee shop and restaurant located on Bole Road, Addis Ababa, Ethiopia.

## About Fu Fut Coffee
- Authentic Ethiopian coffee heritage meets modern café culture
- Located on Bole Road, Addis Ababa, Ethiopia
- Known for single-origin Ethiopian coffee, traditional coffee ceremony, and authentic Ethiopian cuisine
- Brand colors: teal (#0F7B78) and gold (#D6B36A)
- The name "Fu Fut" (ፉ ፉት) reflects Ethiopian coffee culture

## Coffee Offerings
- Single-origin beans from famous Ethiopian regions: Yirgacheffe, Sidamo, Guji, Harrar
- Traditional Ethiopian coffee ceremony (የአማርኛ ቡና ስርአት) — the iconic jebena brewing ritual
- Espresso-based drinks (latte, cappuccino, macchiato, americano)
- Cold brew, iced coffee, and seasonal specialties
- Ethiopian tea (ሻይ) and fresh juices

## Food Menu
- Authentic Ethiopian dishes: Doro Wot (chicken stew), Kitfo (minced beef), Tibs (stir-fried meat)
- Injera — the traditional sourdough flatbread served with most dishes
- Vegetarian options: Misir Wot (lentil stew), Gomen (collard greens), Shiro (chickpea stew)
- Breakfast items, sandwiches, and pastries
- Traditional Ethiopian breakfast with ful (fava beans)

## Services
- Dine-in with cozy, culturally-inspired interior
- Outdoor seating
- Takeaway and delivery available
- Catering for events
- The online order system at futfutcoffee.com/order

## Operating Hours
- Open daily, morning to evening (typical Ethiopian café hours)

## Your Tone & Behavior
- Warm, knowledgeable, and passionate about Ethiopian coffee culture
- Help visitors with menu questions, coffee recommendations, location info, and general inquiries
- If asked about things outside Fu Fut Coffee (politics, religion, etc.), politely steer back to coffee and the café
- Keep responses concise (2-4 sentences) unless the user asks for detailed information
- Use English by default; respond in Amharic if the user writes in Amharic
- You may use Ethiopian coffee terminology (jebena, bunna, buna ceremony) naturally
- Never make up specific prices, phone numbers, or exact addresses — direct visitors to contact the café directly for those details
- If you don't know something specific, say so honestly and suggest the visitor contact the café`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Call Workers AI via REST API using CF_API_TOKEN and CF_ACCOUNT_ID env vars.
 * This is the fallback when the env.AI binding is not configured.
 */
async function callViaRestApi(env, messages) {
  const token = env.CF_API_TOKEN;
  const accountId = env.CF_ACCOUNT_ID || '8793f2ad3a46fcc18960393d39961ba5';
  if (!token) return null;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, max_tokens: 300, temperature: 0.7 }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('[AI REST ERROR]', resp.status, errText);
    throw new Error(`AI API returned ${resp.status}`);
  }

  const data = await resp.json();
  return data?.result?.choices?.[0]?.message?.content
    || data?.result?.response
    || data?.response
    || null;
}

/**
 * Call Workers AI via the env.AI binding (preferred).
 */
async function callViaBinding(env, messages) {
  const response = await env.AI.run(MODEL, {
    messages,
    max_tokens: 300,
    temperature: 0.7,
  });
  return response?.response || response?.text || null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const userMessage = (body.message || '').trim();
  if (!userMessage) {
    return json({ ok: false, error: 'Message is required' }, 400);
  }

  // Build message array: system + history + new user message
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (Array.isArray(body.history) && body.history.length > 0) {
    const recent = body.history.slice(-6);
    for (const msg of recent) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: String(msg.content).slice(0, 500) });
      }
    }
  }

  messages.push({ role: 'user', content: userMessage });

  try {
    let reply = null;

    // Try AI binding first, fall back to REST API
    if (env.AI) {
      reply = await callViaBinding(env, messages);
    } else {
      reply = await callViaRestApi(env, messages);
    }

    if (!reply) {
      return json({ ok: false, error: 'AI did not return a response. Please try again.' }, 502);
    }

    return json({ ok: true, reply: reply.trim() });
  } catch (err) {
    console.error('[AI CHAT ERROR]', err.message || err);
    return json({
      ok: false,
      error: 'AI service temporarily unavailable. Please try again in a moment.',
    }, 502);
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
