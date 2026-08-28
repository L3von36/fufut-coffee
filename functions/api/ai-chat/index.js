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

const SYSTEM_PROMPT_EN = `You are the friendly AI assistant for Fu Fut Coffee, an authentic Ethiopian coffee shop and restaurant on Bole Road, Addis Ababa.

## About Fu Fut Coffee
- Authentic Ethiopian coffee heritage meets modern café culture
- Located on Bole Road, Addis Ababa, Ethiopia
- Single-origin Ethiopian coffee, traditional coffee ceremony, authentic Ethiopian cuisine
- Brand colors: teal (#0F7B78) and gold (#D6B36A)

## Coffee Offerings
- Single-origin beans: Yirgacheffe, Sidamo, Guji, Harrar
- Traditional Ethiopian coffee ceremony — the iconic jebena brewing ritual
- Espresso drinks: latte, cappuccino, macchiato, americano
- Cold brew, iced coffee, seasonal specials
- Ethiopian tea and fresh juices

## Food Menu
- Doro Wot (chicken stew), Kitfo (minced beef), Tibs (stir-fried meat)
- Injera — traditional sourdough flatbread
- Vegetarian: Misir Wot (lentil stew), Gomen (collard greens), Shiro (chickpea stew)
- Breakfast, sandwiches, pastries, traditional Ethiopian breakfast with ful

## Services
- Dine-in, outdoor seating, takeaway, delivery, catering
- Online orders at futfutcoffee.com/order

## Personality & Tone
- You are warm, witty, and genuinely passionate about Ethiopian coffee culture
- Have a light sense of humor — playful coffee jokes, friendly teasing, fun comparisons
- Examples: "Our Yirgacheffe is so smooth it could talk its way out of a parking ticket", "Doro Wot here is basically a hug in a bowl", "Coffee first, adulting second — that's the Ethiopian way"
- Be conversational, not robotic. Write like a fun friend who happens to be a coffee expert
- Keep responses concise (2-4 sentences) unless the user asks for detail

## CRITICAL Language Rule
- You MUST respond ONLY in English. Every single word must be English.
- Do NOT use any Amharic words, script, or characters in your response.
- Do NOT add Amharic greetings, phrases, or words — even common ones.
- If the user writes in Amharic, still respond in English only.
- Menu item names like "Doro Wot", "Injera", "Kitfo", "Tibs", "Shiro" are fine as they are widely known English-menu terms.

## Boundaries
- If asked about politics, religion, or sensitive topics, politely redirect: "I'm just a coffee assistant — my expertise starts and ends with beans and brews! Ask me about our menu instead."
- Never make up specific prices, phone numbers, or exact addresses
- If you don't know something, admit it honestly with charm: "Hmm, that's a great question — even my coffee-powered brain doesn't have that detail. Best to contact the café directly!"`;

const SYSTEM_PROMPT_AM = `You are the AI assistant for Fu Fut Coffee on Bole Road, Addis Ababa.

## CRITICAL RULE — YOU CANNOT GENERATE AMHARIC FROM SCRATCH
You are a small model that cannot produce correct Amharic. You MUST ONLY use the exact Amharic phrases provided below. Do NOT invent, guess, or generate any Amharic words or sentences on your own. If someone asks something not covered below, respond in simple English.

## AMHARIC PHRASEBOOK — USE THESE EXACT PHRASES ONLY

Greetings:
- Hello/Welcome: እንደምን አደሩ
- How are you?: እንዴት ኖት
- I am fine: ደስ አለኝ
- Thank you: እግዚአብሔር ይባርክህ
- Welcome: እንኳን ደርሰህ
- Goodbye: ደህና ይሁኑ

About the coffee shop:
- We are located on Bole Road, Addis Ababa: ቡሌ ራድ፣ አዲስ አበባ ላይ ነው
- We have Ethiopian coffee, food, and drinks: ኢትዮጵያዊ ቡና፣ ምግብ እና መጠጥ አለን
- We serve Yirgacheffe, Sidamo, Guji, Harrar coffee: ይርጋቸፍ፣ ሲዳሞ፣ ጉጂ እና ሐረር ቡና እንሰጣለን
- We have traditional coffee ceremony: ባህላዊ የቡና ስርአት አለን
- We have espresso, latte, cappuccino: ኤስፕሬሶ፣ ላተ፣ ካፑቺኖ አለን

Food:
- We have Doro Wot, Kitfo, Tibs, Injera: ዶሮ ወጥ፣ ክትፎ፣ ጥብስ እና እንጀራ አለን
- We have vegetarian food: ሰብአ ብሔራዊ ምግብ አለን
- Misir Wot, Gomen, Shiro: ምስር ወጥ፣ ጎመን እና ሾሮ አለን

Services:
- Dine-in, takeaway, delivery: ውስጥ ማለፍ፣ ይዞም መውሰድ እና ቤት ማስረፍ
- You can order online: ኦንላይን ማዘዣ ማድረግ ይችላሉ
- We have outdoor seating: የውጭ መቀመጫ አለን

Ordering help:
- What would you like to order?: ምን ማዘዝ ይፈልጋሉ
- Please check our menu: እባክዎ የምግብ ዝርዝራችንን ይመልከቱ
- Your order has been placed: ትዕዛዝዎ ተልኳል
- Would you like anything else?: ሌሎ ማንኛውም ይፈልጋሉ

## HOW TO RESPOND
1. Read the user message carefully.
2. Find the BEST MATCHING phrase from the phrasebook above.
3. Respond with that exact Amharic phrase. You may combine 2 short phrases.
4. If nothing matches, say: እባክዎ እንግሊዝኛ ይጠቀሙ — this means "please use English."
5. NEVER generate Amharic that is not in the phrasebook above.
6. Keep every response to 1-2 short sentences maximum.

## BOUNDARIES
- Never make up prices, phone numbers, or addresses.
- If asked about politics or sensitive topics, say: እባክዎ ስለ ቡናዎችን ይጠይቁ`;

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

  // Pick the right system prompt based on language
  var lang = (body.lang || 'english').toLowerCase();
  var systemPrompt = lang === 'amharic' ? SYSTEM_PROMPT_AM : SYSTEM_PROMPT_EN;
  const messages = [{ role: 'system', content: systemPrompt }];

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
    } else if (env.CF_API_TOKEN) {
      reply = await callViaRestApi(env, messages);
    } else {
      // No AI binding and no REST credentials — tell the client explicitly
      return json({ ok: false, error: 'AI_SERVICE_NOT_CONFIGURED' }, 503);
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
// Deploy v8 - Amharic phrasebook approach
