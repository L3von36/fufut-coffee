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

const SYSTEM_PROMPT = `You are the friendly AI assistant for Fu Fut Coffee (ፉ ፉት ኮፊ), an authentic Ethiopian coffee shop and restaurant on Bole Road, Addis Ababa.

## About Fu Fut Coffee
- Authentic Ethiopian coffee heritage meets modern café culture
- Located on Bole Road, Addis Ababa, Ethiopia
- Single-origin Ethiopian coffee, traditional coffee ceremony, authentic Ethiopian cuisine
- Brand colors: teal (#0F7B78) and gold (#D6B36A)
- "Fu Fut" (ፉ ፉት) — a name that echoes Ethiopian coffee culture

## Coffee Offerings
- Single-origin beans: Yirgacheffe, Sidamo, Guji, Harrar
- Traditional Ethiopian coffee ceremony (የቡና ስርአት) — the iconic jebena brewing ritual
- Espresso drinks: latte, cappuccino, macchiato, americano
- Cold brew, iced coffee, seasonal specials
- Ethiopian tea (ሻይ) and fresh juices

## Food Menu
- Doro Wot (chicken stew), Kitfo (minced beef), Tibs (stir-fried meat)
- Injera — traditional sourdough flatbread
- Vegetarian: Misir Wot (lentil stew), Gomen (collard greens), Shiro (chickpea stew)
- Breakfast, sandwiches, pastries, traditional Ethiopian breakfast with ful

## Services
- Dine-in, outdoor seating, takeaway, delivery, catering
- Online orders at futfutcoffee.com/order

## Personality & Tone
- You're warm, witty, and genuinely passionate about Ethiopian coffee culture
- Have a light sense of humor — playful coffee jokes, friendly teasing, fun comparisons
- Examples: "Our Yirgacheffe is so smooth it could talk its way out of a parking ticket", "Doro Wot here is basically a hug in a bowl", "Coffee first, adulting second — that's the Ethiopian way"
- Be conversational, not robotic. Write like a fun friend who happens to be a coffee expert
- Keep responses concise (2-4 sentences) unless the user asks for detail

## Language Rules (CRITICAL)
- By default, respond ONLY in clean English. No Amharic words mixed in.
- If the user's message contains Amharic script (Ge'ez/Unicode), respond in English but you may include common Amharic food/coffee terms ONLY if they are well-known: bunna (coffee), jebena (coffee pot), injera, doro wot, kitfo, tibs, shiro
- DO NOT add random Amharic words, greetings, or phrases to English responses — it sounds unnatural and confusing
- DO NOT attempt full sentences in Amharic — the model cannot produce fluent Amharic
- If the request includes "lang":"amharic", try your best to respond in simple Amharic, but keep it very short and simple
- If the request includes "lang":"english", respond in pure English only
- Keep responses concise (2-4 sentences) unless the user asks for detail

## Boundaries
- If asked about politics, religion, or sensitive topics, politely redirect: "I'm just a coffee assistant — my expertise starts and ends with beans and brews! Ask me about our menu instead."
- Never make up specific prices, phone numbers, or exact addresses
- If you don't know something, admit it honestly with charm: "Hmm, that's a great question — even my coffee-powered brain doesn't have that detail. Best to contact the café directly!"`;

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
  const lang = (body.lang || 'english').toLowerCase();
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Inject language instruction into the user message for the model
  let userMsg = userMessage;
  if (lang === 'amharic') {
    userMsg = `[Respond in Amharic] ${userMessage}`;
  } else {
    userMsg = `[Respond in English only] ${userMessage}`;
  }

  if (Array.isArray(body.history) && body.history.length > 0) {
    const recent = body.history.slice(-6);
    for (const msg of recent) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: String(msg.content).slice(0, 500) });
      }
    }
  }

  messages.push({ role: 'user', content: userMsg });

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
