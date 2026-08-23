const CONSULTATION_PLANS = {
  rapid: {
    name: 'Rapid Advisory Call',
    duration: '30 min',
    price: 'HKD 1,000',
    amountHkdCents: 100000,
  },
  strategy: {
    name: 'AI Safety Strategy Session',
    duration: '60 min',
    price: 'HKD 2,000',
    amountHkdCents: 200000,
  },
  advisory: {
    name: 'Executive Advisory Sprint',
    duration: '2 hrs',
    price: 'HKD 5,000',
    amountHkdCents: 500000,
  },
};

const STARTER_KIT_PRODUCT = {
  id: 'ai_native_ehs_starter_kit',
  name: 'AI-Native EHS Starter Kit',
  price: 'HKD 299',
  amountHkdCents: 29900,
  description: 'Founder access to practical AI prompts, workflows, guardrails, and career tools for EHS professionals.',
  downloadUrl: '/starter-kit/AI_Native_EHS_Starter_Kit_Founder_Edition.pdf',
};

const AVATAR_VIDEO_PLANS = {
  single: {
    name: 'AI Avatar Video — Single Video',
    quantity: '1 video',
    price: 'HKD 499',
    amountHkdCents: 49900,
  },
  monthly4: {
    name: 'AI Avatar Video — Monthly 4',
    quantity: '4 videos',
    price: 'HKD 1,680',
    amountHkdCents: 168000,
  },
  growth8: {
    name: 'AI Avatar Video — Growth 8',
    quantity: '8 videos',
    price: 'HKD 3,040',
    amountHkdCents: 304000,
  },
  partner12: {
    name: 'AI Avatar Video — Partner 12',
    quantity: '12 videos',
    price: 'HKD 4,080',
    amountHkdCents: 408000,
  },
  upTo3: {
    name: 'AI Avatar Video - Up to 3 Minutes',
    quantity: '1 video up to 3 minutes',
    price: 'HKD 899',
    amountHkdCents: 89900,
  },
  upTo5: {
    name: 'AI Avatar Video - Up to 5 Minutes',
    quantity: '1 video up to 5 minutes',
    price: 'HKD 1,380',
    amountHkdCents: 138000,
  },
  upTo10: {
    name: 'AI Avatar Video - Up to 10 Minutes',
    quantity: '1 video up to 10 minutes',
    price: 'HKD 2,480',
    amountHkdCents: 248000,
  },
  upTo20: {
    name: 'AI Avatar Video - Up to 20 Minutes',
    quantity: '1 video up to 20 minutes',
    price: 'HKD 4,280',
    amountHkdCents: 428000,
  },
  upTo30: {
    name: 'AI Avatar Video - Up to 30 Minutes',
    quantity: '1 video up to 30 minutes',
    price: 'HKD 5,880',
    amountHkdCents: 588000,
  },
};

const PLAN_SCHEDULER_ENV_KEYS = {
  rapid: 'SCHEDULER_RAPID_URL',
  strategy: 'SCHEDULER_STRATEGY_URL',
  advisory: 'SCHEDULER_ADVISORY_URL',
};

const jsonResponse = (body, status = 200) => (
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
);

const getSchedulerUrl = (env, planId) => (
  env[PLAN_SCHEDULER_ENV_KEYS[planId]] || env.CONSULTATION_SCHEDULER_URL || ''
);

const createStripeCheckoutSession = async (request, env) => {
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({
      message: 'Stripe checkout is not configured yet. Add STRIPE_SECRET_KEY in Cloudflare Pages settings.',
    }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid payment request.' }, 400);
  }

  const plan = CONSULTATION_PLANS[payload?.planId];
  if (!plan) {
    return jsonResponse({ message: 'Unknown consultation plan.' }, 400);
  }

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(payload.planId)}#schedule`);
  params.append('cancel_url', `${origin}/?checkout=cancelled#consultation`);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'hkd');
  params.append('line_items[0][price_data][unit_amount]', String(plan.amountHkdCents));
  params.append('line_items[0][price_data][product_data][name]', `${plan.name} (${plan.duration})`);
  params.append('line_items[0][price_data][product_data][description]', 'Alvin Liao Safety & AI Consultancy Services');
  params.append('metadata[plan_id]', payload.planId);
  params.append('metadata[service]', 'consultation');
  params.append('allow_promotion_codes', 'true');
  params.append('billing_address_collection', 'auto');

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const stripeData = await stripeResponse.json();
  if (!stripeResponse.ok) {
    return jsonResponse({
      message: stripeData?.error?.message || 'Unable to create checkout session.',
    }, stripeResponse.status);
  }

  return jsonResponse({ url: stripeData.url });
};

const createStarterKitCheckoutSession = async (request, env) => {
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({
      message: 'Stripe checkout is not configured yet. Add STRIPE_SECRET_KEY in Cloudflare Pages settings.',
    }, 503);
  }

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/?checkout=starter_kit_success&session_id={CHECKOUT_SESSION_ID}#ehs-starter-kit`);
  params.append('cancel_url', `${origin}/?checkout=starter_kit_cancelled#ehs-starter-kit`);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'hkd');
  params.append('line_items[0][price_data][unit_amount]', String(STARTER_KIT_PRODUCT.amountHkdCents));
  params.append('line_items[0][price_data][product_data][name]', STARTER_KIT_PRODUCT.name);
  params.append('line_items[0][price_data][product_data][description]', STARTER_KIT_PRODUCT.description);
  params.append('metadata[service]', 'starter_kit');
  params.append('metadata[product_id]', STARTER_KIT_PRODUCT.id);
  params.append('allow_promotion_codes', 'true');
  params.append('billing_address_collection', 'auto');

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const stripeData = await stripeResponse.json();
  if (!stripeResponse.ok) {
    return jsonResponse({
      message: stripeData?.error?.message || 'Unable to create checkout session.',
    }, stripeResponse.status);
  }

  return jsonResponse({ url: stripeData.url });
};

const createAvatarCheckoutSession = async (request, env) => {
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({
      message: 'Stripe checkout is not configured yet. Add STRIPE_SECRET_KEY in Cloudflare Pages settings.',
    }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid payment request.' }, 400);
  }

  const plan = AVATAR_VIDEO_PLANS[payload?.planId];
  if (!plan) {
    return jsonResponse({ message: 'Unknown AI avatar video package.' }, 400);
  }

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/ai-avatar/?checkout=success&session_id={CHECKOUT_SESSION_ID}#payment-status`);
  params.append('cancel_url', `${origin}/ai-avatar/?checkout=cancelled#packages`);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', 'hkd');
  params.append('line_items[0][price_data][unit_amount]', String(plan.amountHkdCents));
  params.append('line_items[0][price_data][product_data][name]', plan.name);
  params.append('line_items[0][price_data][product_data][description]', `${plan.quantity}. Includes client-supplied approved script, AI avatar and voice, branded background, English subtitles, 1080p MP4, and one minor revision.`);
  params.append('metadata[plan_id]', payload.planId);
  params.append('metadata[service]', 'ai_avatar_video');
  params.append('allow_promotion_codes', 'true');
  params.append('billing_address_collection', 'auto');

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const stripeData = await stripeResponse.json();
  if (!stripeResponse.ok) {
    return jsonResponse({
      message: stripeData?.error?.message || 'Unable to create checkout session.',
    }, stripeResponse.status);
  }

  return jsonResponse({ url: stripeData.url });
};

const getCheckoutSession = async (request, env) => {
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({
      message: 'Stripe checkout is not configured yet. Add STRIPE_SECRET_KEY in Cloudflare Pages settings.',
    }, 503);
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return jsonResponse({ message: 'Missing or invalid checkout session.' }, 400);
  }

  const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=customer`, {
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    },
  });

  const stripeData = await stripeResponse.json();
  if (!stripeResponse.ok) {
    return jsonResponse({
      message: stripeData?.error?.message || 'Unable to retrieve checkout session.',
    }, stripeResponse.status);
  }

  const planId = stripeData?.metadata?.plan_id;
  const plan = CONSULTATION_PLANS[planId];
  if (!plan) {
    return jsonResponse({ message: 'Unknown consultation plan.' }, 400);
  }

  if (stripeData.payment_status !== 'paid') {
    return jsonResponse({ message: 'Payment has not been completed yet.' }, 402);
  }

  return jsonResponse({
    paid: true,
    plan: {
      id: planId,
      name: plan.name,
      duration: plan.duration,
      price: plan.price,
    },
    customerEmail: stripeData.customer_details?.email || stripeData.customer_email || stripeData.customer?.email || '',
    customerName: stripeData.customer_details?.name || stripeData.customer?.name || '',
    schedulerUrl: getSchedulerUrl(env, planId),
  });
};

const getStarterKitSession = async (request, env) => {
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({
      message: 'Stripe checkout is not configured yet. Add STRIPE_SECRET_KEY in Cloudflare Pages settings.',
    }, 503);
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return jsonResponse({ message: 'Missing or invalid checkout session.' }, 400);
  }

  const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=customer`, {
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    },
  });

  const stripeData = await stripeResponse.json();
  if (!stripeResponse.ok) {
    return jsonResponse({
      message: stripeData?.error?.message || 'Unable to retrieve checkout session.',
    }, stripeResponse.status);
  }

  if (stripeData?.metadata?.service !== 'starter_kit' || stripeData?.metadata?.product_id !== STARTER_KIT_PRODUCT.id) {
    return jsonResponse({ message: 'This checkout session is not for the starter kit.' }, 400);
  }

  if (stripeData.payment_status !== 'paid') {
    return jsonResponse({ message: 'Payment has not been completed yet.' }, 402);
  }

  return jsonResponse({
    paid: true,
    product: {
      id: STARTER_KIT_PRODUCT.id,
      name: STARTER_KIT_PRODUCT.name,
      price: STARTER_KIT_PRODUCT.price,
    },
    downloadUrl: STARTER_KIT_PRODUCT.downloadUrl,
    customerEmail: stripeData.customer_details?.email || stripeData.customer_email || stripeData.customer?.email || '',
    customerName: stripeData.customer_details?.name || stripeData.customer?.name || '',
  });
};

const getVisitorCountry = (request) => {
  const country = String(request.cf?.country || '').toUpperCase();

  return jsonResponse({
    country,
    defaultLanguage: country === 'CN' ? 'zh' : 'en',
  });
};

const sanitizeLeadText = (value, maxLength = 240) => String(value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const captureReadinessLead = async (request, env) => {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid readiness lead payload.' }, 400);
  }

  const email = sanitizeLeadText(payload?.email, 180).toLowerCase();
  const name = sanitizeLeadText(payload?.name, 140);
  if (!name || !email || !isValidEmail(email)) {
    return jsonResponse({ message: 'Name and a valid email are required.' }, 400);
  }

  const safeScores = {
    individual: Number(payload?.scores?.individual || 0),
    corporate: Number(payload?.scores?.corporate || 0),
    direct: Number(payload?.scores?.direct || 0),
  };
  const safeAnswers = Array.isArray(payload?.answers)
    ? payload.answers.slice(0, 8).map((answer) => ({
      id: sanitizeLeadText(answer?.id, 80),
      prompt: sanitizeLeadText(answer?.prompt, 260),
      value: sanitizeLeadText(answer?.value, 80),
      label: sanitizeLeadText(answer?.label, 180),
    }))
    : [];

  const lead = {
    id: `readiness_${Date.now()}_${crypto.randomUUID()}`,
    name,
    email,
    company: sanitizeLeadText(payload?.company, 180),
    challenge: sanitizeLeadText(payload?.challenge, 600),
    resultKey: sanitizeLeadText(payload?.resultKey, 60),
    resultTitle: sanitizeLeadText(payload?.resultTitle, 220),
    scores: safeScores,
    answers: safeAnswers,
    language: sanitizeLeadText(payload?.language, 12),
    pageUrl: sanitizeLeadText(payload?.pageUrl, 500),
    createdAt: new Date().toISOString(),
  };

  let stored = false;
  let forwarded = false;
  const errors = [];

  if (env.READINESS_LEADS?.put) {
    try {
      await env.READINESS_LEADS.put(lead.id, JSON.stringify(lead));
      stored = true;
    } catch (error) {
      errors.push(`kv:${error?.message || 'failed'}`);
    }
  }

  if (env.READINESS_LEAD_WEBHOOK_URL) {
    try {
      const webhookResponse = await fetch(env.READINESS_LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      forwarded = webhookResponse.ok;
      if (!webhookResponse.ok) {
        errors.push(`webhook:${webhookResponse.status}`);
      }
    } catch (error) {
      errors.push(`webhook:${error?.message || 'failed'}`);
    }
  }

  return jsonResponse({
    ok: true,
    id: lead.id,
    stored,
    forwarded,
    captureConfigured: stored || forwarded,
    errors,
  });
};

const parseRangeHeader = (rangeHeader, size) => {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || '');
  if (!match) return null;

  let start = match[1] === '' ? null : Number(match[1]);
  let end = match[2] === '' ? null : Number(match[2]);

  if (start === null && end === null) return null;

  if (start === null) {
    const suffixLength = end;
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    if (!Number.isFinite(start) || start < 0) return null;
    if (end === null || end >= size) {
      end = size - 1;
    }
  }

  if (!Number.isFinite(end) || start > end || start >= size) return null;
  return { start, end };
};

const serveAssetWithRangeSupport = async (request, env) => {
  const rangeHeader = request.headers.get('Range');
  const assetRequest = request.method === 'HEAD' && rangeHeader
    ? new Request(request.url, { method: 'GET', headers: request.headers })
    : request;
  const assetResponse = await env.ASSETS.fetch(assetRequest);
  if (!assetResponse.ok) return assetResponse;

  const baseHeaders = new Headers(assetResponse.headers);
  baseHeaders.set('Accept-Ranges', 'bytes');
  baseHeaders.set('Content-Type', baseHeaders.get('Content-Type') || 'video/mp4');

  if (!rangeHeader) {
    return new Response(request.method === 'HEAD' ? null : assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers: baseHeaders,
    });
  }

  const assetBuffer = await assetResponse.arrayBuffer();
  const size = assetBuffer.byteLength;
  const range = parseRangeHeader(rangeHeader, size);

  if (!range) {
    return new Response(null, {
      status: 416,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes */${size}`,
      },
    });
  }

  const { start, end } = range;
  const chunk = assetBuffer.slice(start, end + 1);
  const headers = new Headers(baseHeaders);
  headers.set('Content-Length', String(chunk.byteLength));
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);

  return new Response(request.method === 'HEAD' ? null : chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers,
  });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (url.pathname === '/zh') {
        return Response.redirect(`${url.origin}/zh/`, 301);
      }

      const legacyLanguage = url.searchParams.get('lang');
      if (url.pathname === '/' && legacyLanguage === 'zh') {
        return Response.redirect(`${url.origin}/zh/`, 301);
      }
      if (url.pathname === '/' && legacyLanguage === 'en') {
        return Response.redirect(`${url.origin}/`, 301);
      }
      if (url.pathname === '/yuetie-technology-air-ground-robotics' && legacyLanguage === 'zh') {
        return Response.redirect(`${url.origin}/zh/yuetie-technology-air-ground-robotics`, 301);
      }
      if (url.pathname === '/yuetie-technology-air-ground-robotics' && legacyLanguage === 'en') {
        return Response.redirect(`${url.origin}/yuetie-technology-air-ground-robotics`, 301);
      }
    }

    if (
      url.pathname === '/api/create-checkout-session'
      || url.pathname === '/api/checkout-session'
      || url.pathname === '/api/create-starter-kit-checkout'
      || url.pathname === '/api/create-avatar-checkout'
      || url.pathname === '/api/starter-kit-session'
      || url.pathname === '/api/readiness-lead'
      || url.pathname === '/api/visitor-country'
    ) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204 });
      }

      if (url.pathname === '/api/visitor-country') {
        if (request.method !== 'GET') {
          return jsonResponse({ message: 'Method not allowed.' }, 405);
        }
        return getVisitorCountry(request);
      }

      if (url.pathname === '/api/create-checkout-session') {
        if (request.method !== 'POST') {
          return jsonResponse({ message: 'Method not allowed.' }, 405);
        }
        return createStripeCheckoutSession(request, env);
      }

      if (url.pathname === '/api/create-starter-kit-checkout') {
        if (request.method !== 'POST') {
          return jsonResponse({ message: 'Method not allowed.' }, 405);
        }
        return createStarterKitCheckoutSession(request, env);
      }

      if (url.pathname === '/api/create-avatar-checkout') {
        if (request.method !== 'POST') {
          return jsonResponse({ message: 'Method not allowed.' }, 405);
        }
        return createAvatarCheckoutSession(request, env);
      }

      if (url.pathname === '/api/starter-kit-session') {
        if (request.method !== 'GET') {
          return jsonResponse({ message: 'Method not allowed.' }, 405);
        }
        return getStarterKitSession(request, env);
      }

      if (url.pathname === '/api/readiness-lead') {
        if (request.method !== 'POST') {
          return jsonResponse({ message: 'Method not allowed.' }, 405);
        }
        return captureReadinessLead(request, env);
      }

      if (request.method !== 'GET') {
        return jsonResponse({ message: 'Method not allowed.' }, 405);
      }
      return getCheckoutSession(request, env);
    }

    if (
      url.pathname === '/safety_ai_training_video.mp4'
      || (url.pathname.startsWith('/ai-avatar/demos/') && url.pathname.endsWith('.mp4'))
    ) {
      return serveAssetWithRangeSupport(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
