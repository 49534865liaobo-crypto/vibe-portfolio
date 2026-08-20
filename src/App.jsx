import { useState, useEffect, useRef } from 'react'
import { Activity, ArrowRight, Award, Bot, Brain, BriefcaseBusiness, CalendarCheck, CheckCircle2, ChevronDown, Clapperboard, CreditCard, Download, ExternalLink, Globe2, GraduationCap, Heart, Loader2, Radar, Route, Scale, ShieldCheck, Siren, UsersRound } from 'lucide-react'
import './App.css'
import { locales } from './locales.js'
import SafetyNexusEngine from './components/SafetyNexusEngine.jsx'

const LINKEDIN_URL = 'https://www.linkedin.com/in/ir-bo-alvin-liao-2b237b95/';
const CORPORATE_DISCOVERY_URL = 'https://cal.com/bo-liao-etzveq';

// Optional: paste hosted Stripe/PayPal/PayMe payment links here.
// When blank, the site calls /api/create-checkout-session for Stripe Checkout.
const CONSULTATION_PAYMENT_LINKS = {
  rapid: '',
  strategy: '',
  advisory: '',
};

const STARTER_KIT_PAYMENT_LINK = '';
const MANUAL_LANGUAGE_STORAGE_KEY = 'portfolio_lang_manual_v1';
const LEGACY_LANGUAGE_STORAGE_KEY = 'portfolio_lang_v2';
const SUPPORTED_LANGUAGES = new Set(['en', 'zh']);
const SITE_URL = 'https://vibe-portfolio-dny.pages.dev';
const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/safety-nexus-og.jpg`;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-PCN1TDTK6H';
const GSC_VERIFICATION_TOKEN = import.meta.env.VITE_GSC_VERIFICATION_TOKEN || '';
const ANALYTICS_PRIVATE_QUERY_PARAMS = new Set([
  'session_id',
  'payment_intent',
  'payment_intent_client_secret',
  'redirect_status',
]);
const CONSULTATION_VALUES_HKD = {
  rapid: 1000,
  strategy: 2000,
  advisory: 5000,
};
const STARTER_KIT_VALUE_HKD = 299;
const PURCHASE_ANALYTICS_STORAGE_PREFIX = 'safety_nexus_ga_purchase_v1:';
const AI_REFERRERS = [
  ['chatgpt.com', 'chatgpt'],
  ['chat.openai.com', 'chatgpt'],
  ['perplexity.ai', 'perplexity'],
  ['gemini.google.com', 'gemini'],
  ['claude.ai', 'claude'],
  ['copilot.microsoft.com', 'microsoft_copilot'],
  ['poe.com', 'poe'],
  ['you.com', 'you_com'],
  ['phind.com', 'phind'],
];

const isSupportedLanguage = (value) => SUPPORTED_LANGUAGES.has(value);
const isValidGaMeasurementId = (value) => /^G-[A-Z0-9]+$/.test(value);

const getUrlPortfolioLanguage = () => {
  try {
    if (window.location.pathname === '/zh' || window.location.pathname.startsWith('/zh/')) {
      return 'zh';
    }
    const requested = new URLSearchParams(window.location.search).get('lang');
    return isSupportedLanguage(requested) ? requested : '';
  } catch {
    return '';
  }
};

const getManualPortfolioLanguage = () => {
  try {
    const saved = localStorage.getItem(MANUAL_LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(saved) ? saved : '';
  } catch {
    return '';
  }
};

const saveManualPortfolioLanguage = (nextLang) => {
  if (!isSupportedLanguage(nextLang)) return;

  try {
    localStorage.setItem(MANUAL_LANGUAGE_STORAGE_KEY, nextLang);
    localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, nextLang);
  } catch {
    // Language switching still works even when storage is unavailable.
  }
};

const getInitialPortfolioLanguage = () => {
  return getUrlPortfolioLanguage() || getManualPortfolioLanguage() || 'en';
};

const upsertMetaTag = (attribute, key, content) => {
  if (!content) return;

  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertLinkTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value));
};

const syncHomepageStructuredData = (t, lang) => {
  const script = document.head.querySelector('#site-jsonld');
  if (!script || !t?.geo?.faq) return;

  try {
    const data = JSON.parse(script.textContent);
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [];
    const language = lang === 'zh' ? 'zh-Hans' : 'en';
    const website = graph.find((node) => node['@type'] === 'WebSite');
    const faq = graph.find((node) => node['@type'] === 'FAQPage');
    const pageUrl = lang === 'zh' ? `${SITE_URL}/zh/` : `${SITE_URL}/`;
    const pageId = `${pageUrl}#webpage`;
    let page = graph.find((node) => node['@id'] === pageId);

    if (website) website.inLanguage = [language];
    if (faq) {
      faq.mainEntity = t.geo.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      }));
    }

    if (!page) {
      page = { '@type': 'WebPage', '@id': pageId };
      graph.push(page);
    }

    Object.assign(page, {
      url: pageUrl,
      name: t.seo.title,
      description: t.seo.desc,
      inLanguage: language,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#alvin-liao` },
      mainEntity: { '@id': `${SITE_URL}/#services` },
      dateModified: '2026-08-20',
    });

    data['@graph'] = graph;
    script.textContent = JSON.stringify(data);
  } catch {
    // Keep the static JSON-LD intact if a browser extension or partial DOM blocks parsing.
  }
};

const installGoogleSearchConsoleMeta = () => {
  if (!GSC_VERIFICATION_TOKEN) return;
  upsertMetaTag('name', 'google-site-verification', GSC_VERIFICATION_TOKEN);
};

const installGoogleAnalytics = () => {
  if (!isValidGaMeasurementId(GA_MEASUREMENT_ID)) return;
  if (document.querySelector(`script[data-ga-measurement-id="${GA_MEASUREMENT_ID}"]`)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  script.dataset.gaMeasurementId = GA_MEASUREMENT_ID;
  document.head.appendChild(script);
};

const getAnalyticsLocation = () => {
  const url = new URL(window.location.href);
  ANALYTICS_PRIVATE_QUERY_PARAMS.forEach((param) => url.searchParams.delete(param));
  return {
    href: url.href,
    path: `${url.pathname}${url.search}${url.hash}`,
  };
};

const trackGoogleAnalyticsPageView = (lang) => {
  if (!isValidGaMeasurementId(GA_MEASUREMENT_ID) || typeof window.gtag !== 'function') return;

  const location = getAnalyticsLocation();

  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: location.href,
    page_path: location.path,
    language: lang,
  });
};

const trackGoogleAnalyticsEvent = (eventName, params = {}) => {
  if (!isValidGaMeasurementId(GA_MEASUREMENT_ID) || typeof window.gtag !== 'function') return false;

  const location = getAnalyticsLocation();

  window.gtag('event', eventName, {
    ...params,
    page_location: location.href,
    page_path: location.path,
    transport_type: 'beacon',
  });

  return true;
};

const detectAiReferralSource = () => {
  const utmSource = new URLSearchParams(window.location.search).get('utm_source')?.toLowerCase() || '';
  const utmMatch = AI_REFERRERS.find(([, source]) => utmSource.includes(source));
  if (utmMatch) return utmMatch[1];

  try {
    const referrerHost = new URL(document.referrer).hostname.toLowerCase();
    return AI_REFERRERS.find(([host]) => referrerHost === host || referrerHost.endsWith(`.${host}`))?.[1] || '';
  } catch {
    return '';
  }
};

const trackAiReferralVisit = () => {
  const source = detectAiReferralSource();
  if (!source) return;

  const dedupeKey = `safety_nexus_ai_referral:${source}:${window.location.pathname}`;
  try {
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, 'sent');
  } catch {
    // Analytics can continue without storage access.
  }

  trackGoogleAnalyticsEvent('ai_referral_visit', {
    ai_source: source,
    traffic_source_type: 'ai_assistant',
  });
};

const getAnalyticsTransactionId = async (sessionId) => {
  if (!sessionId || !window.crypto?.subtle) return '';

  const bytes = new TextEncoder().encode(sessionId);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `safety_nexus_${fingerprint.slice(0, 24)}`;
};

const trackVerifiedPurchase = async ({ sessionId, itemId, itemName, itemCategory, value }) => {
  if (!sessionId || !Number.isFinite(value)) return;

  try {
    const transactionId = await getAnalyticsTransactionId(sessionId);
    if (!transactionId) return;

    const storageKey = `${PURCHASE_ANALYTICS_STORAGE_PREFIX}${transactionId}`;
    if (localStorage.getItem(storageKey) === 'sent') return;

    const wasQueued = trackGoogleAnalyticsEvent('purchase', {
      transaction_id: transactionId,
      currency: 'HKD',
      value,
      items: [{
        item_id: itemId,
        item_name: itemName,
        item_category: itemCategory,
        price: value,
        quantity: 1,
      }],
    });

    if (wasQueued) localStorage.setItem(storageKey, 'sent');
  } catch {
    // Payment verification remains successful even if analytics storage is unavailable.
  }
};

const parseCloudflareTraceCountry = (traceText = '') => {
  const locLine = traceText
    .split('\n')
    .find((line) => line.startsWith('loc='));
  return locLine?.split('=')[1]?.trim().toUpperCase() || '';
};

const getLocalFallbackLanguage = () => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const hasMainlandChineseLocale = languages.some((language) => {
    const normalised = String(language || '').toLowerCase();
    return normalised === 'zh-cn' || normalised.includes('zh-hans-cn');
  });

  return timeZone === 'Asia/Shanghai' || hasMainlandChineseLocale ? 'zh' : 'en';
};

const getVisitorDefaultLanguage = async () => {
  try {
    const visitorResponse = await fetch('/api/visitor-country', { cache: 'no-store' });
    if (visitorResponse.ok) {
      const visitor = await visitorResponse.json();
      const country = String(visitor?.country || '').toUpperCase();
      if (country) return country === 'CN' ? 'zh' : 'en';
    }
  } catch {
    // Local Vite dev server does not serve the Cloudflare Worker endpoint.
  }

  try {
    const traceResponse = await fetch('/cdn-cgi/trace', { cache: 'no-store' });
    if (traceResponse.ok) {
      const country = parseCloudflareTraceCountry(await traceResponse.text());
      if (country) return country === 'CN' ? 'zh' : 'en';
    }
  } catch {
    // Fall through to browser-only signals when Cloudflare trace is unavailable.
  }

  return getLocalFallbackLanguage();
};

const TRAINING_ICONS = {
  leadership: Award,
  culture: UsersRound,
  osha: Scale,
  crisis: Siren,
  humanError: Brain,
  risk: Radar,
  global: Globe2,
  agile: Route,
  behavior: Activity,
  career: BriefcaseBusiness,
};

const ADVISORY_SERVICE_ICONS = [ShieldCheck, Brain, Route];
const FORWARD_CASE_ICONS = {
  global: Globe2,
  community: UsersRound,
  standards: Scale,
  robotics: Radar,
  finance: Activity,
  bot: Bot,
};

const TRAINING_IMAGE_URLS = {
  'safety-leadership': '/training-popups-generated/safety-leadership.avif',
  'safety-culture': '/training-popups-generated/safety-culture.avif',
  'osha-regulations': '/training-popups-generated/osha-regulations.avif',
  'crisis-management': '/training-popups-generated/crisis-management.avif',
  'human-error-reduction': '/training-popups-generated/human-error-reduction.avif',
  'risk-management': '/training-popups-generated/risk-management.avif',
  'china-us-uk-ehs': '/training-popups-generated/china-us-uk-ehs.avif',
  'agile-safety-strategy': '/training-popups-generated/agile-safety-strategy.avif',
  'behaviour-based-safety': '/training-popups-generated/behaviour-based-safety.avif',
  'safety-career-development': '/training-popups-generated/safety-career-development.avif',
};

const OFFER_MODULE_IDS = {
  individual: 'ehs-starter-kit',
  corporate: 'corporate-diagnostic',
  direct: 'consultation',
};

const OFFER_ANCHOR_IDS = new Set([
  'ehs-starter-kit',
  'corporate-diagnostic',
  'ai-advisory',
  'consultation',
  'safety-training',
]);

const getOfferModuleFromLocation = (isStarterKitSuccess) => {
  const hash = window.location.hash;
  if (hash === '#ehs-starter-kit' || isStarterKitSuccess) return 'individual';
  if (hash === '#corporate-diagnostic' || hash === '#ai-advisory') return 'corporate';
  if (hash === '#consultation' || hash === '#safety-training') return 'direct';
  return 'individual';
};

// Adapted from the Ripple Feedback and Like Burst patterns in Kinetics by Csaba Kissi.
// Source: https://github.com/ckissi/kinetics and https://kinetics.colorion.co/
const TactileAction = ({ as: Component = 'button', className = '', children, onPointerDown, ...props }) => {
  const [ripples, setRipples] = useState([]);
  const timersRef = useRef(new Set());
  const rippleIdRef = useRef(0);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const handlePointerDown = (event) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || props.disabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    rippleIdRef.current += 1;
    const id = rippleIdRef.current;
    const ripple = {
      id,
      size,
      x: event.clientX - rect.left - size / 2,
      y: event.clientY - rect.top - size / 2,
    };

    setRipples((current) => [...current.slice(-2), ripple]);
    const timer = window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item.id !== id));
      timersRef.current.delete(timer);
    }, 680);
    timersRef.current.add(timer);
  };

  const content = (
    <>
      {children}
      {ripples.map((ripple) => (
        <span
          aria-hidden="true"
          className="tactile-ripple"
          key={ripple.id}
          style={{
            width: ripple.size,
            height: ripple.size,
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
    </>
  );
  const actionProps = {
    ...props,
    className: `tactile-action ${className}`.trim(),
    onPointerDown: handlePointerDown,
  };

  return Component === 'a' ? <a {...actionProps}>{content}</a> : <button {...actionProps}>{content}</button>;
};

const LikeBurstButton = ({ liked, likeCount, onToggle, t }) => {
  const [isPopping, setIsPopping] = useState(false);
  const [particles, setParticles] = useState([]);
  const popTimerRef = useRef(null);
  const particleTimerRef = useRef(null);
  const particleIdRef = useRef(0);

  useEffect(() => () => {
    window.clearTimeout(popTimerRef.current);
    window.clearTimeout(particleTimerRef.current);
  }, []);

  const handleClick = () => {
    const nextLiked = !liked;
    onToggle();

    window.clearTimeout(popTimerRef.current);
    setIsPopping(true);
    popTimerRef.current = window.setTimeout(() => setIsPopping(false), 340);

    window.clearTimeout(particleTimerRef.current);
    if (!nextLiked || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setParticles([]);
      return;
    }

    const nextParticles = Array.from({ length: 8 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / 8;
      const distance = 28;
      particleIdRef.current += 1;
      return {
        id: particleIdRef.current,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
      };
    });
    setParticles(nextParticles);
    particleTimerRef.current = window.setTimeout(() => setParticles([]), 660);
  };

  return (
    <TactileAction
      type="button"
      className={`like-btn ${liked ? 'liked' : ''} ${isPopping ? 'pop' : ''}`}
      onClick={handleClick}
      aria-pressed={liked}
    >
      <Heart className="like-heart" size={18} fill={liked ? 'currentColor' : 'none'} />
      <span>{liked ? t.engagement.likedLabel : t.engagement.likeLabel}</span>
      <strong>{t.engagement.likeCount.replace('{count}', likeCount)}</strong>
      {particles.map((particle) => (
        <span
          aria-hidden="true"
          className="like-particle"
          key={particle.id}
          style={{ '--tx': `${particle.x}px`, '--ty': `${particle.y}px` }}
        />
      ))}
    </TactileAction>
  );
};

const buildSchedulerUrl = (schedulerUrl, sessionInfo) => {
  if (!schedulerUrl) return '';

  try {
    const url = new URL(schedulerUrl);
    if (sessionInfo?.customerEmail && !url.searchParams.has('email')) {
      url.searchParams.set('email', sessionInfo.customerEmail);
    }
    if (sessionInfo?.customerName && !url.searchParams.has('name')) {
      url.searchParams.set('name', sessionInfo.customerName);
    }
    if (sessionInfo?.plan?.id && !url.searchParams.has('utm_content')) {
      url.searchParams.set('utm_content', sessionInfo.plan.id);
    }
    return url.toString();
  } catch {
    return schedulerUrl;
  }
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const toFileSafeName = (value = 'ai-safety-readiness') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 70) || 'ai-safety-readiness';

const buildReadinessSnapshotHtml = ({ t, lead, result, resultKey, scores, selectedAnswers, lang }) => {
  const snapshot = t.readinessCheck.snapshot;
  const generatedDate = new Date().toLocaleDateString(lang === 'zh' ? 'zh-HK' : 'en-HK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0) || 1;
  const scoreRows = ['individual', 'corporate', 'direct'].map((key) => {
    const label = snapshot.scoreLabels[key];
    const width = Math.round((scores[key] / total) * 100);
    return `
      <div class="score-row">
        <span>${escapeHtml(label)}</span>
        <strong>${scores[key]}/${total}</strong>
        <div><i style="width:${width}%"></i></div>
      </div>
    `;
  }).join('');
  const answerRows = selectedAnswers.map((answer) => `
    <li>
      <strong>${escapeHtml(answer.prompt)}</strong>
      <span>${escapeHtml(answer.label)}</span>
    </li>
  `).join('');
  const nextActions = (result.nextActions || []).map(action => `<li>${escapeHtml(action)}</li>`).join('');

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(snapshot.title)}</title>
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #0f172a; background: #eef7fb; }
    main { max-width: 840px; margin: 0 auto; padding: 42px 24px 56px; }
    .sheet { overflow: hidden; border-radius: 24px; background: #fff; box-shadow: 0 22px 70px rgba(15, 23, 42, 0.12); }
    .hero { padding: 34px; color: #ecfeff; background: linear-gradient(135deg, #083344, #0f172a 58%, #115e59); }
    .eyebrow { margin: 0 0 12px; color: #67e8f9; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 34px; line-height: 1.08; }
    .hero p { max-width: 680px; margin: 14px 0 0; color: #cbd5e1; line-height: 1.65; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 18px 34px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .meta div, section { padding: 24px 34px; }
    .meta small, h2 { display: block; margin: 0 0 7px; color: #0f766e; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    .meta strong { color: #0f172a; line-height: 1.35; }
    h2 { font-size: 13px; }
    h3 { margin: 0 0 10px; color: #0f172a; font-size: 24px; line-height: 1.2; }
    p, li { color: #475569; line-height: 1.65; }
    .recommendation { border-bottom: 1px solid #e2e8f0; }
    .score-row { display: grid; grid-template-columns: 1fr auto; gap: 8px 14px; align-items: center; margin: 12px 0; }
    .score-row div { grid-column: 1 / -1; height: 9px; padding: 0; border-radius: 999px; background: #e2e8f0; }
    .score-row i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #06b6d4, #14b8a6); }
    .answer-list { display: grid; gap: 10px; padding: 0; list-style: none; }
    .answer-list li { padding: 14px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc; }
    .answer-list strong, .answer-list span { display: block; }
    .answer-list span { margin-top: 4px; color: #0f766e; font-weight: 800; }
    .next-actions ul { margin-bottom: 0; }
    footer { padding: 22px 34px; color: #64748b; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 13px; line-height: 1.6; }
    @media print { body { background: #fff; } main { padding: 0; } .sheet { box-shadow: none; border-radius: 0; } }
    @media (max-width: 640px) { .meta { grid-template-columns: 1fr; } h1 { font-size: 28px; } .hero, .meta div, section, footer { padding-left: 22px; padding-right: 22px; } }
  </style>
</head>
<body>
  <main>
    <div class="sheet">
      <div class="hero">
        <p class="eyebrow">${escapeHtml(snapshot.eyebrow)}</p>
        <h1>${escapeHtml(snapshot.title)}</h1>
        <p>${escapeHtml(snapshot.intro)}</p>
      </div>
      <div class="meta">
        <div><small>${escapeHtml(snapshot.preparedFor)}</small><strong>${escapeHtml(lead.name)}</strong></div>
        <div><small>${escapeHtml(snapshot.organisation)}</small><strong>${escapeHtml(lead.company || snapshot.notProvided)}</strong></div>
        <div><small>${escapeHtml(snapshot.generatedOn)}</small><strong>${escapeHtml(generatedDate)}</strong></div>
      </div>
      <section class="recommendation">
        <h2>${escapeHtml(snapshot.recommendationLabel)}</h2>
        <h3>${escapeHtml(result.title)}</h3>
        <p>${escapeHtml(result.desc)}</p>
      </section>
      <section>
        <h2>${escapeHtml(snapshot.scoreTitle)}</h2>
        ${scoreRows}
      </section>
      <section>
        <h2>${escapeHtml(snapshot.answersTitle)}</h2>
        <ul class="answer-list">${answerRows}</ul>
      </section>
      <section class="next-actions">
        <h2>${escapeHtml(snapshot.nextActionsTitle)}</h2>
        <ul>${nextActions}</ul>
      </section>
      <footer>
        <strong>${escapeHtml(snapshot.footerTitle)}</strong><br />
        ${escapeHtml(snapshot.footerText.replace('{path}', resultKey))}
      </footer>
    </div>
  </main>
</body>
</html>`;
};

const downloadReadinessSnapshot = (snapshotHtml, lead) => {
  const blob = new Blob([snapshotHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${toFileSafeName(lead.name)}-ai-safety-readiness-snapshot.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const ProjectModal = ({ project, onClose, t }) => {
  if (!project) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="modal-header">
          <span className="tag-pill">{project.tag}</span>
          <h2>{project.title}</h2>
          <p className="modal-desc">{project.desc}</p>
        </div>

        <div className="modal-body">
          <div className="glass-card detail-card">
            <h4><span className="icon">🛡️</span> {t.projects.roleLabel}</h4>
            <p>{project.role}</p>
          </div>

          <div className="glass-card detail-card">
            <h4><span className="icon">🏗️</span> {t.projects.archLabel}</h4>
            <div className="tech-stack">
              {project.architecture.split('+').map((tech, i) => (
                <span key={i} className="tech-tag">{tech.trim()}</span>
              ))}
            </div>
          </div>

          {project.longContent && (
            <div className="glass-card detail-card project-long-content" style={{ gridColumn: '1 / -1', marginTop: '1rem' }} dangerouslySetInnerHTML={{ __html: project.longContent }} />
          )}
        </div>

        <div className="modal-footer">
          {project.link ? (
            <TactileAction
              as="a"
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-lg"
              onClick={() => trackGoogleAnalyticsEvent('project_launch_click', {
                project_name: project.title,
              })}
            >
              {t.projects.launchBtn}
            </TactileAction>
          ) : (
            <span className="btn-lg btn-lg-disabled" aria-disabled="true">
              {t.projects.privateDemoCta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const RoleModal = ({ role, onClose, t }) => {
  if (!role) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>{role.title}</h2>
          <p className="modal-desc">{role.org}</p>
        </div>

        <div className="modal-body role-modal-body">
          {role.longContent ? (
            <div className="project-long-content" dangerouslySetInnerHTML={{ __html: role.longContent }} />
          ) : (
            <div className="glass-card detail-card">
              <p>{role.desc}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <TactileAction type="button" className="btn-lg action-btn" onClick={onClose}>
            {t.journey.closeWindow}
          </TactileAction>
        </div>
      </div>
    </div>
  );
};

const TrainingCourseModal = ({ course, onClose, t }) => {
  if (!course) return null;
  const Icon = TRAINING_ICONS[course.icon] || ShieldCheck;
  const courseImageUrl = TRAINING_IMAGE_URLS[course.id] || '/safety_course_popup_ai.avif';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="training-course-modal glass-panel" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="training-modal-image">
          <img src={courseImageUrl} alt={`${course.title} course illustration`} loading="lazy" decoding="async" />
          <div className="training-modal-badge">
            <Icon size={24} />
            <span>{course.format}</span>
          </div>
        </div>
        <div className="training-modal-content">
          <span className="tag-pill">{t.safetyTraining.modalEyebrow}</span>
          <h2>{course.title}</h2>
          <p className="training-modal-summary">{course.summary}</p>
          <p className="training-modal-detail">{course.detail}</p>
          <div className="training-modal-meta">
            <div>
              <strong>{t.safetyTraining.audienceLabel}</strong>
              <span>{course.audience}</span>
            </div>
            <div>
              <strong>{t.safetyTraining.formatLabel}</strong>
              <span>{course.format}</span>
            </div>
          </div>
          <div className="training-modal-outcomes">
            <h3>{t.safetyTraining.outcomesTitle}</h3>
            <ul>
              {course.highlights.map((highlight, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={16} />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="training-modal-footer">
            <TactileAction
              as="a"
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="service-card-cta"
              onClick={() => trackGoogleAnalyticsEvent('linkedin_click', {
                source: 'training_course_modal',
                course_id: course.id,
                course_title: course.title,
              })}
            >
              {t.safetyTraining.contactCta}
              <ArrowRight size={18} />
            </TactileAction>
            <TactileAction type="button" className="training-modal-close" onClick={onClose}>
              {t.safetyTraining.closeLabel}
            </TactileAction>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReadinessCheckModal = ({ isOpen, onClose, onRecommend, t }) => {
  const [answers, setAnswers] = useState({});
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    company: '',
    challenge: '',
    consent: false,
  });
  const [leadStatus, setLeadStatus] = useState('idle');
  const [leadError, setLeadError] = useState('');

  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = t.readinessCheck.questions.length;
  const scores = t.readinessCheck.questions.reduce((acc, question) => {
    const selectedValue = answers[question.id];
    if (selectedValue) {
      acc[selectedValue] = (acc[selectedValue] || 0) + 1;
    }
    return acc;
  }, { individual: 0, corporate: 0, direct: 0 });
  const resultKey = answeredCount === totalQuestions
    ? ['corporate', 'direct', 'individual'].reduce((best, key) => (scores[key] > scores[best] ? key : best), 'individual')
    : '';
  const result = resultKey ? t.readinessCheck.results[resultKey] : null;
  const selectedAnswers = t.readinessCheck.questions.map((question) => {
    const selectedValue = answers[question.id];
    const option = question.options.find(item => item.value === selectedValue);
    return {
      id: question.id,
      prompt: question.prompt,
      value: selectedValue || '',
      label: option?.label || '',
    };
  });
  const snapshotLabels = t.readinessCheck.snapshot;

  const handleAnswer = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setLeadStatus('idle');
    setLeadError('');
  };

  const handleRecommend = () => {
    if (!resultKey) return;
    trackGoogleAnalyticsEvent('readiness_result_follow', {
      result_key: resultKey,
      result_title: result?.title || '',
    });
    onRecommend(resultKey);
    onClose();
  };

  const resetAnswers = () => {
    setAnswers({});
    setLeadStatus('idle');
    setLeadError('');
  };

  const updateLeadField = (field, value) => {
    setLeadForm((current) => ({ ...current, [field]: value }));
    if (leadError) setLeadError('');
    if (leadStatus !== 'idle') setLeadStatus('idle');
  };

  const handleSnapshotSubmit = async (event) => {
    event.preventDefault();
    if (!result) return;

    const email = leadForm.email.trim();
    const name = leadForm.name.trim();
    if (!name || !email) {
      setLeadError(snapshotLabels.errorRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLeadError(snapshotLabels.errorEmail);
      return;
    }
    if (!leadForm.consent) {
      setLeadError(snapshotLabels.errorConsent);
      return;
    }

    const lead = {
      name,
      email,
      company: leadForm.company.trim(),
      challenge: leadForm.challenge.trim(),
      resultKey,
      resultTitle: result.title,
      scores,
      answers: selectedAnswers,
      pageUrl: window.location.href,
      language: document.documentElement.lang || 'en',
      createdAt: new Date().toISOString(),
    };

    setLeadStatus('submitting');
    setLeadError('');

    try {
      const response = await fetch('/api/readiness-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (!response.ok) {
        throw new Error('Lead capture failed');
      }

      const snapshotHtml = buildReadinessSnapshotHtml({
        t,
        lead,
        result,
        resultKey,
        scores,
        selectedAnswers,
        lang: lead.language,
      });
      downloadReadinessSnapshot(snapshotHtml, lead);
      trackGoogleAnalyticsEvent('generate_lead', {
        lead_source: 'ai_safety_readiness_check',
        lead_type: resultKey,
      });
      trackGoogleAnalyticsEvent('readiness_snapshot_download', {
        result_key: resultKey,
        result_title: result.title,
      });
      setLeadStatus('success');
    } catch {
      setLeadStatus('idle');
      setLeadError(snapshotLabels.errorSubmit);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="readiness-modal glass-panel" onClick={event => event.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="readiness-modal-header">
          <span className="tag-pill">{t.readinessCheck.eyebrow}</span>
          <h2>{t.readinessCheck.title}</h2>
          <p>{t.readinessCheck.subtitle}</p>
        </div>
        <div className="readiness-modal-body">
          <div className="readiness-questions">
            <div className="readiness-progress">
              <span>{t.readinessCheck.progress.replace('{answered}', answeredCount).replace('{total}', totalQuestions)}</span>
              <button type="button" onClick={resetAnswers}>{t.readinessCheck.resetLabel}</button>
            </div>
            {t.readinessCheck.questions.map((question, idx) => (
              <fieldset className="readiness-question" key={question.id}>
                <legend>
                  <span>{String(idx + 1).padStart(2, '0')}</span>
                  {question.prompt}
                </legend>
                <div className="readiness-options">
                  {question.options.map((option) => (
                    <button
                      type="button"
                      className={answers[question.id] === option.value ? 'selected' : ''}
                      onClick={() => handleAnswer(question.id, option.value)}
                      key={option.label}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <aside className={`readiness-result ${result ? 'ready' : ''}`}>
            <Radar size={24} />
            {result ? (
              <>
                <span>{t.readinessCheck.recommendLabel}</span>
                <h3>{result.title}</h3>
                <p>{result.desc}</p>
                <form className="readiness-lead-form" onSubmit={handleSnapshotSubmit}>
                  <div className="readiness-lead-head">
                    <Download size={18} />
                    <div>
                      <strong>{snapshotLabels.formTitle}</strong>
                      <small>{snapshotLabels.formText}</small>
                    </div>
                  </div>
                  <label>
                    <span>{snapshotLabels.nameLabel}</span>
                    <input
                      value={leadForm.name}
                      onChange={(event) => updateLeadField('name', event.target.value)}
                      placeholder={snapshotLabels.namePlaceholder}
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    <span>{snapshotLabels.emailLabel}</span>
                    <input
                      type="email"
                      value={leadForm.email}
                      onChange={(event) => updateLeadField('email', event.target.value)}
                      placeholder={snapshotLabels.emailPlaceholder}
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    <span>{snapshotLabels.companyLabel}</span>
                    <input
                      value={leadForm.company}
                      onChange={(event) => updateLeadField('company', event.target.value)}
                      placeholder={snapshotLabels.companyPlaceholder}
                      autoComplete="organization"
                    />
                  </label>
                  <label>
                    <span>{snapshotLabels.challengeLabel}</span>
                    <textarea
                      value={leadForm.challenge}
                      onChange={(event) => updateLeadField('challenge', event.target.value)}
                      placeholder={snapshotLabels.challengePlaceholder}
                      rows="3"
                    />
                  </label>
                  <label className="readiness-consent">
                    <input
                      type="checkbox"
                      checked={leadForm.consent}
                      onChange={(event) => updateLeadField('consent', event.target.checked)}
                    />
                    <span>{snapshotLabels.consentLabel}</span>
                  </label>
                  {leadError && <p className="readiness-lead-error">{leadError}</p>}
                  {leadStatus === 'success' && (
                    <p className="readiness-lead-success">
                      <CheckCircle2 size={16} />
                      {snapshotLabels.successText}
                    </p>
                  )}
                  <button type="submit" className="readiness-snapshot-submit" disabled={leadStatus === 'submitting'}>
                    {leadStatus === 'submitting' ? (
                      <>
                        <Loader2 size={17} className="spin" />
                        {snapshotLabels.submittingLabel}
                      </>
                    ) : (
                      <>
                        <Download size={17} />
                        {snapshotLabels.downloadLabel}
                      </>
                    )}
                  </button>
                </form>
                <button type="button" className="readiness-result-cta secondary" onClick={handleRecommend}>
                  {result.cta}
                  <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <>
                <span>{t.readinessCheck.incompleteTitle}</span>
                <h3>{t.readinessCheck.resultTitle}</h3>
                <p>{t.readinessCheck.incompleteText}</p>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

const SafetyTrainingCard = ({ t, onCourseSelect }) => (
  <article id="safety-training" className="service-card safety-training-card">
    <div className="service-card-media safety-training-media">
      <div className="service-card-icon safety-training-icon">
        <GraduationCap size={24} />
      </div>
      <span>{t.safetyTraining.metrics[0].value} {t.safetyTraining.metrics[0].label}</span>
    </div>
    <div className="service-card-body">
      <span className="service-card-eyebrow">{t.safetyTraining.eyebrow}</span>
      <h3>{t.safetyTraining.title}</h3>
      <p>{t.safetyTraining.subtitle}</p>
      <details className="training-course-fold">
        <summary>
          {t.safetyTraining.foldLabel}
          <span>{t.safetyTraining.courses.length} {t.safetyTraining.moduleLabel}</span>
        </summary>
        <div className="folded-course-list">
          {t.safetyTraining.courses.map(course => {
            const Icon = TRAINING_ICONS[course.icon] || ShieldCheck;

            return (
              <button
                type="button"
                onClick={() => {
                  trackGoogleAnalyticsEvent('training_course_open', {
                    course_id: course.id,
                    course_title: course.title,
                  });
                  onCourseSelect(course);
                }}
                key={course.id}
              >
                <Icon size={18} />
                <div>
                  <strong>{course.title}</strong>
                  <small>{course.summary}</small>
                </div>
                <ArrowRight size={15} />
              </button>
            );
          })}
        </div>
      </details>
      <TactileAction
        as="a"
        href={LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="service-card-cta"
        onClick={() => trackGoogleAnalyticsEvent('linkedin_click', { source: 'safety_training_card' })}
      >
        {t.safetyTraining.cardCta}
        <ArrowRight size={18} />
      </TactileAction>
    </div>
  </article>
);

const AdvisorySection = ({ t }) => (
  <section id="ai-advisory" className="advisory-section">
    <div className="advisory-shell">
      <div className="advisory-header">
        <span className="tag-pill">{t.advisory.eyebrow}</span>
        <h2>{t.advisory.title}</h2>
        <p>{t.advisory.subtitle}</p>
      </div>

      <div className="advisory-body">
        <article className="advisory-flagship glass-panel">
          <div className="advisory-flagship-top">
            <div className="advisory-icon">
              <ShieldCheck size={26} />
            </div>
            <span>{t.advisory.flagship.duration}</span>
          </div>
          <h3>{t.advisory.flagship.title}</h3>
          <p>{t.advisory.flagship.desc}</p>

          <div className="advisory-proof-row">
            {t.advisory.proof.map((proof, idx) => (
              <div className="advisory-proof" key={idx}>
                <strong>{proof.value}</strong>
                <span>{proof.label}</span>
              </div>
            ))}
          </div>

          <div className="advisory-deliverables">
            <h4>{t.advisory.flagship.deliverableTitle}</h4>
            <ul>
              {t.advisory.flagship.deliverables.map((deliverable, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={17} />
                  <span>{deliverable}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="advisory-actions">
            <TactileAction as="a" href="#corporate-diagnostic" className="advisory-primary">
              <CalendarCheck size={18} />
              {t.advisory.primaryCta}
              <ArrowRight size={18} />
            </TactileAction>
            <TactileAction as="a" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="advisory-secondary">
              {t.advisory.secondaryCta}
              <ExternalLink size={17} />
            </TactileAction>
            {t.advisory.brochures.map((brochure) => (
              <TactileAction
                as="a"
                href={brochure.href}
                className="advisory-download"
                download
                key={brochure.href}
              >
                <Download size={17} />
                {brochure.label}
              </TactileAction>
            ))}
          </div>
        </article>

        <div className="advisory-service-grid">
          {t.advisory.services.map((service, idx) => {
            const Icon = ADVISORY_SERVICE_ICONS[idx] || ShieldCheck;

            return (
              <article className="advisory-service-card" key={service.title}>
                <div className="advisory-service-icon">
                  <Icon size={22} />
                </div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <ul>
                  {service.outputs.map((output, outputIdx) => (
                    <li key={outputIdx}>{output}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

const CorporateDiagnosticSection = ({ t }) => (
  <section id="corporate-diagnostic" className="corporate-diagnostic-section">
    <div className="corporate-diagnostic-shell">
      <article className="corporate-diagnostic-lead glass-panel">
        <span className="tag-pill">{t.corporateDiagnostic.eyebrow}</span>
        <h2>{t.corporateDiagnostic.title}</h2>
        <p>{t.corporateDiagnostic.subtitle}</p>

        <div className="corporate-signal-list" aria-label={t.corporateDiagnostic.painTitle}>
          <h3>{t.corporateDiagnostic.painTitle}</h3>
          <ul>
            {t.corporateDiagnostic.painPoints.map((point) => (
              <li key={point}>
                <Siren size={17} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="corporate-diagnostic-actions">
          <TactileAction as="a" href={CORPORATE_DISCOVERY_URL} target="_blank" rel="noopener noreferrer" className="corporate-primary">
            <CalendarCheck size={18} />
            {t.corporateDiagnostic.primaryCta}
            <ArrowRight size={18} />
          </TactileAction>
          {t.advisory.brochures.map((brochure) => (
            <TactileAction
              as="a"
              href={brochure.href}
              className="corporate-download"
              download
              key={brochure.href}
            >
              <Download size={17} />
              {brochure.label}
            </TactileAction>
          ))}
          <TactileAction as="a" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="corporate-secondary">
            {t.corporateDiagnostic.linkedinCta}
            <ExternalLink size={17} />
          </TactileAction>
        </div>
      </article>

      <div className="corporate-diagnostic-side">
        <article className="corporate-process-card glass-panel">
          <div className="corporate-card-heading">
            <Route size={20} />
            <h3>{t.corporateDiagnostic.processTitle}</h3>
          </div>
          <div className="corporate-process-list">
            {t.corporateDiagnostic.process.map((step, idx) => (
              <div className="corporate-process-step" key={step.title}>
                <span>{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="corporate-buyer-card glass-panel">
          <div className="corporate-card-heading">
            <UsersRound size={20} />
            <h3>{t.corporateDiagnostic.buyerTitle}</h3>
          </div>
          <ul>
            {t.corporateDiagnostic.buyerGroups.map((group) => (
              <li key={group}>
                <CheckCircle2 size={17} />
                <span>{group}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="corporate-ladder glass-panel">
        <div className="corporate-card-heading">
          <Scale size={20} />
          <h3>{t.corporateDiagnostic.ladderTitle}</h3>
        </div>
        <div className="corporate-ladder-grid">
          {t.corporateDiagnostic.ladder.map((item, idx) => (
            <div className={`corporate-ladder-card ${idx === 1 ? 'featured' : ''}`} key={item.title}>
              <span className="corporate-ladder-step">{item.step}</span>
              <h4>{item.title}</h4>
              <div className="corporate-ladder-meta">
                <strong>{item.price}</strong>
                <span>{item.timing}</span>
              </div>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  </section>
);

const StarterKitSection = ({ t }) => {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  const sessionId = params.get('session_id');
  const isStarterKitSuccess = checkoutStatus === 'starter_kit_success';
  const [pendingKitPayment, setPendingKitPayment] = useState(false);
  const [kitError, setKitError] = useState('');
  const [kitSession, setKitSession] = useState(null);
  const [isVerifyingKit, setIsVerifyingKit] = useState(isStarterKitSuccess && Boolean(sessionId));

  useEffect(() => {
    if (!isStarterKitSuccess || !sessionId) return;

    let isActive = true;
    const verifyStarterKit = async () => {
      try {
        setIsVerifyingKit(true);
        const response = await fetch(`/api/starter-kit-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();

        if (!response.ok || !data.paid) {
          throw new Error(data.message || t.starterKit.error);
        }

        if (isActive) {
          setKitSession(data);
          setKitError('');
        }
      } catch (error) {
        if (isActive) {
          setKitError(error.message || t.starterKit.error);
        }
      } finally {
        if (isActive) {
          setIsVerifyingKit(false);
        }
      }
    };

    verifyStarterKit();
    return () => {
      isActive = false;
    };
  }, [isStarterKitSuccess, sessionId, t.starterKit.error]);

  const handleStarterKitCheckout = async () => {
    setKitError('');
    trackGoogleAnalyticsEvent('starter_kit_checkout_click', {
      product_id: 'ai_native_ehs_starter_kit',
      source: 'offer_hub',
    });

    if (STARTER_KIT_PAYMENT_LINK) {
      window.location.assign(STARTER_KIT_PAYMENT_LINK);
      return;
    }

    try {
      setPendingKitPayment(true);
      const response = await fetch('/api/create-starter-kit-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'ai_native_ehs_starter_kit' }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.message || t.starterKit.error);
      }

      window.location.assign(data.url);
    } catch (error) {
      setKitError(error.message || t.starterKit.error);
    } finally {
      setPendingKitPayment(false);
    }
  };

  return (
    <section id="ehs-starter-kit" className="starter-kit-section">
      <div className="starter-kit-shell">
        <div className="starter-kit-hero glass-panel">
          <div className="starter-kit-copy">
            <span className="tag-pill">{t.starterKit.eyebrow}</span>
            <h2>{t.starterKit.title}</h2>
            <p>{t.starterKit.subtitle}</p>
            <div className="starter-kit-fit">
              <h3>{t.starterKit.fitTitle}</h3>
              <ul>
                {t.starterKit.fitList.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={17} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="starter-kit-purchase">
            <span>{t.starterKit.priceNote}</span>
            <strong>{t.starterKit.price}</strong>
            <p>{t.starterKit.deliveryNote}</p>
            <TactileAction
              type="button"
              className="starter-kit-buy"
              onClick={handleStarterKitCheckout}
              disabled={pendingKitPayment}
              aria-busy={pendingKitPayment}
            >
              <CreditCard size={18} />
              {pendingKitPayment ? t.starterKit.pending : t.starterKit.primaryCta}
              <ArrowRight size={18} />
            </TactileAction>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="starter-kit-secondary">
              {t.starterKit.secondaryCta}
              <ExternalLink size={16} />
            </a>
          </aside>
        </div>

        {(isVerifyingKit || kitSession || kitError) && (
          <div className={`starter-kit-status glass-panel ${kitError ? 'warning' : ''}`}>
            {isVerifyingKit ? (
              <>
                <Loader2 size={22} className="spin-icon" />
                <span>{t.starterKit.verifying}</span>
              </>
            ) : kitError ? (
              <>
                <ShieldCheck size={22} />
                <span>{kitError}</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={22} />
                <div>
                  <strong>{t.starterKit.successTitle}</strong>
                  <span>{t.starterKit.successText}</span>
                  {kitSession?.customerEmail && <small>{kitSession.customerEmail}</small>}
                  {kitSession?.downloadUrl && (
                    <a className="starter-kit-download" href={kitSession.downloadUrl} download>
                      <Download size={16} />
                      {t.starterKit.downloadCta}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="starter-kit-grid">
          {t.starterKit.included.map((item, idx) => {
            const KitIcon = [Brain, Route, ShieldCheck, Award][idx] || CheckCircle2;

            return (
              <article className="starter-kit-card" key={item.title}>
                <div className="starter-kit-card-icon">
                  <KitIcon size={22} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            );
          })}
        </div>

        <div className="starter-kit-bottom">
          <article className="starter-kit-guardrail glass-panel">
            <ShieldCheck size={22} />
            <div>
              <h3>{t.starterKit.guardrailTitle}</h3>
              <p>{t.starterKit.guardrailText}</p>
            </div>
          </article>
          <article className="starter-kit-next glass-panel">
            <GraduationCap size={22} />
            <div>
              <h3>{t.starterKit.nextStepTitle}</h3>
              <p>{t.starterKit.nextStepText}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};

const ConsultationSection = ({ t }) => {
  const [pendingPlanId, setPendingPlanId] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('strategy');
  const [selectedTrainingCourse, setSelectedTrainingCourse] = useState(null);
  const selectedPlan = t.consultation.plans.find((plan) => plan.id === selectedPlanId) || t.consultation.plans[1] || t.consultation.plans[0];

  const handleCheckout = async (plan = selectedPlan) => {
    if (!plan) return;
    setPaymentError('');
    trackGoogleAnalyticsEvent('consultation_checkout_click', {
      plan_id: plan.id,
      plan_title: plan.title,
      plan_price: plan.price,
      source: 'offer_hub',
    });

    const hostedPaymentUrl = CONSULTATION_PAYMENT_LINKS[plan.id];
    if (hostedPaymentUrl) {
      window.location.assign(hostedPaymentUrl);
      return;
    }

    try {
      setPendingPlanId(plan.id);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.message || t.consultation.paymentError);
      }

      window.location.assign(data.url);
    } catch (error) {
      setPaymentError(error.message || t.consultation.paymentError);
    } finally {
      setPendingPlanId(null);
    }
  };

  const handlePlanKeyDown = (event, planId) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setSelectedPlanId(planId);
  };

  return (
    <section id="consultation" className="consultation-section">
      <div className="consultation-shell">
        <div className="consultation-copy">
          <span className="tag-pill">{t.consultation.eyebrow}</span>
          <h2>{t.consultation.title}</h2>
          <p>{t.consultation.subtitle}</p>
          <div className="consultation-proof-grid">
            {t.consultation.proofs.map((proof, idx) => (
              <div className="consultation-proof" key={idx}>
                <strong>{proof.value}</strong>
                <span>{proof.label}</span>
              </div>
            ))}
          </div>
          <div className="consultation-contact-row">
            <TactileAction as="a" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="consultation-link secondary">
              <CalendarCheck size={18} /> {t.consultation.linkedinCta}
            </TactileAction>
          </div>
        </div>

        <div className="consultation-plans">
          {t.consultation.plans.map((plan, idx) => (
            <article
              className={`consultation-plan ${idx === 1 ? 'featured' : ''} ${selectedPlanId === plan.id ? 'selected' : ''}`}
              key={plan.id}
              role="button"
              tabIndex={0}
              aria-pressed={selectedPlanId === plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              onKeyDown={(event) => handlePlanKeyDown(event, plan.id)}
            >
              <div className="plan-meta">
                <span>{plan.duration}</span>
                {idx === 1 && <em>{t.consultation.recommended}</em>}
              </div>
              <h3>{plan.title}</h3>
              <p>{plan.desc}</p>
              <div className="plan-price">{plan.price}</div>
              <ul>
                {plan.outcomes.map((outcome, outcomeIdx) => (
                  <li key={outcomeIdx}>
                    <ShieldCheck size={16} />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
              <span className="plan-select-state">
                {selectedPlanId === plan.id ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                {selectedPlanId === plan.id ? t.consultation.selectedLabel : t.consultation.selectLabel}
              </span>
            </article>
          ))}
        </div>
        {selectedPlan && (
          <div className="consultation-checkout-panel glass-panel">
            <div>
              <span>{t.consultation.checkoutEyebrow}</span>
              <h3>{selectedPlan.title}</h3>
              <p>{t.consultation.checkoutText}</p>
              <div className="checkout-plan-meta">
                <strong>{selectedPlan.price}</strong>
                <small>{selectedPlan.duration}</small>
              </div>
            </div>
            <TactileAction
              type="button"
              className="payment-btn"
              onClick={() => handleCheckout(selectedPlan)}
              disabled={pendingPlanId === selectedPlan.id}
              aria-busy={pendingPlanId === selectedPlan.id}
            >
              <CreditCard size={18} />
              {pendingPlanId === selectedPlan.id ? t.consultation.paymentPending : t.consultation.checkoutCta}
              <ArrowRight size={18} />
            </TactileAction>
          </div>
        )}
        {paymentError && (
          <div className="payment-error" role="status">
            {paymentError}
          </div>
        )}
        <div className="service-card-row">
          <SafetyTrainingCard t={t} onCourseSelect={setSelectedTrainingCourse} />
          <article className="service-card ai-video-card">
            <div className="service-card-media ai-video-media">
              <div className="service-card-icon">
                <Clapperboard size={24} />
              </div>
              <span>{t.consultation.videoService.eyebrow}</span>
            </div>
            <div className="service-card-body">
              <span className="service-card-eyebrow">{t.consultation.videoService.eyebrow}</span>
              <h3>{t.consultation.videoService.title}</h3>
              <p>{t.consultation.videoService.desc}</p>
              <div className="ai-training-video-frame">
                <video
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  poster="/safety_ai_training_video_poster.jpg"
                >
                  <source src="/safety_ai_training_video.mp4" type="video/mp4" />
                </video>
              </div>
              <TactileAction as="a" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="service-card-cta">
                {t.consultation.videoService.cta}
                <ArrowRight size={18} />
              </TactileAction>
            </div>
          </article>
        </div>
      </div>
      <TrainingCourseModal course={selectedTrainingCourse} onClose={() => setSelectedTrainingCourse(null)} t={t} />
    </section>
  );
};

const OfferPathwaySection = ({ t }) => {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  const sessionId = params.get('session_id');
  const isStarterKitSuccess = checkoutStatus === 'starter_kit_success';
  const [pendingKitPayment, setPendingKitPayment] = useState(false);
  const [kitError, setKitError] = useState('');
  const [kitSession, setKitSession] = useState(null);
  const [isVerifyingKit, setIsVerifyingKit] = useState(isStarterKitSuccess && Boolean(sessionId));
  const [pendingPlanId, setPendingPlanId] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('strategy');
  const [selectedTrainingCourse, setSelectedTrainingCourse] = useState(null);
  const [isReadinessOpen, setIsReadinessOpen] = useState(false);

  const [activeModule, setActiveModule] = useState(() => getOfferModuleFromLocation(isStarterKitSuccess));
  const selectedPlan = t.consultation.plans.find((plan) => plan.id === selectedPlanId) || t.consultation.plans[1] || t.consultation.plans[0];

  useEffect(() => {
    const handleHashChange = () => setActiveModule(getOfferModuleFromLocation(isStarterKitSuccess));
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isStarterKitSuccess]);

  useEffect(() => {
    const targetId = window.location.hash.replace('#', '');
    if (!OFFER_ANCHOR_IDS.has(targetId)) return;
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' });
    });
  }, [activeModule]);

  useEffect(() => {
    if (!isStarterKitSuccess || !sessionId) return;

    let isActive = true;
    const verifyStarterKit = async () => {
      try {
        setIsVerifyingKit(true);
        const response = await fetch(`/api/starter-kit-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();

        if (!response.ok || !data.paid) {
          throw new Error(data.message || t.starterKit.error);
        }

        if (isActive) {
          setKitSession(data);
          setKitError('');
          setActiveModule('individual');
          void trackVerifiedPurchase({
            sessionId,
            itemId: data.product.id,
            itemName: data.product.name,
            itemCategory: 'digital_product',
            value: STARTER_KIT_VALUE_HKD,
          });
        }
      } catch (error) {
        if (isActive) {
          setKitError(error.message || t.starterKit.error);
          setActiveModule('individual');
        }
      } finally {
        if (isActive) {
          setIsVerifyingKit(false);
        }
      }
    };

    verifyStarterKit();
    return () => {
      isActive = false;
    };
  }, [isStarterKitSuccess, sessionId, t.starterKit.error]);

  const handleStarterKitCheckout = async () => {
    setKitError('');
    const starterKitItem = {
      item_id: 'ai_native_ehs_starter_kit',
      item_name: 'AI-Native EHS Starter Kit',
      item_category: 'digital_product',
      price: STARTER_KIT_VALUE_HKD,
      quantity: 1,
    };
    trackGoogleAnalyticsEvent('starter_kit_checkout_click', {
      product_id: starterKitItem.item_id,
      source: 'offer_hub',
    });
    trackGoogleAnalyticsEvent('begin_checkout', {
      currency: 'HKD',
      value: STARTER_KIT_VALUE_HKD,
      items: [starterKitItem],
    });

    if (STARTER_KIT_PAYMENT_LINK) {
      window.location.assign(STARTER_KIT_PAYMENT_LINK);
      return;
    }

    try {
      setPendingKitPayment(true);
      const response = await fetch('/api/create-starter-kit-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: 'ai_native_ehs_starter_kit' }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.message || t.starterKit.error);
      }

      window.location.assign(data.url);
    } catch (error) {
      setKitError(error.message || t.starterKit.error);
    } finally {
      setPendingKitPayment(false);
    }
  };

  const handleCheckout = async (plan = selectedPlan) => {
    if (!plan) return;
    setPaymentError('');
    const value = CONSULTATION_VALUES_HKD[plan.id];
    const consultationItem = {
      item_id: `consultation_${plan.id}`,
      item_name: plan.title,
      item_category: 'consultation',
      price: value,
      quantity: 1,
    };
    trackGoogleAnalyticsEvent('consultation_checkout_click', {
      plan_id: plan.id,
      plan_title: plan.title,
      plan_price: plan.price,
      source: 'offer_hub',
    });
    trackGoogleAnalyticsEvent('begin_checkout', {
      currency: 'HKD',
      value,
      items: [consultationItem],
    });

    const hostedPaymentUrl = CONSULTATION_PAYMENT_LINKS[plan.id];
    if (hostedPaymentUrl) {
      window.location.assign(hostedPaymentUrl);
      return;
    }

    try {
      setPendingPlanId(plan.id);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.message || t.consultation.paymentError);
      }

      window.location.assign(data.url);
    } catch (error) {
      setPaymentError(error.message || t.consultation.paymentError);
    } finally {
      setPendingPlanId(null);
    }
  };

  const handlePlanKeyDown = (event, planId) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    trackGoogleAnalyticsEvent('consultation_plan_select', {
      plan_id: planId,
      input: 'keyboard',
      source: 'offer_hub',
    });
    setSelectedPlanId(planId);
  };

  const selectModule = (moduleId) => {
    trackGoogleAnalyticsEvent('service_path_open', {
      path_id: moduleId,
      source: 'offer_hub',
    });
    setActiveModule(moduleId);
    if (!window.matchMedia('(max-width: 980px)').matches) return;

    window.setTimeout(() => {
      const target = document.getElementById(OFFER_MODULE_IDS[moduleId]);
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }, 0);
  };

  const handleReadinessRecommendation = (resultKey) => {
    const moduleMap = {
      individual: 'individual',
      corporate: 'corporate',
      direct: 'direct',
    };
    const nextModule = moduleMap[resultKey] || 'individual';
    setActiveModule(nextModule);
    requestAnimationFrame(() => {
      document.getElementById('services')?.scrollIntoView({ block: 'start' });
    });
  };

  const renderModuleButton = (moduleId, Icon, meta, sideLabel) => {
    const isOpen = activeModule === moduleId;

    return (
      <button
        type="button"
        className="offer-module-summary"
        onClick={() => selectModule(moduleId)}
        aria-expanded={isOpen}
      >
        <span className="offer-module-step">{meta.step}</span>
        <span className="offer-module-icon">
          <Icon size={22} />
        </span>
        <span className="offer-module-copy">
          <small>{meta.eyebrow}</small>
          <strong>{meta.title}</strong>
          <span>{meta.summary}</span>
        </span>
        <span className="offer-module-side">{sideLabel}</span>
        <span className={`offer-module-toggle ${isOpen ? 'open' : ''}`}>
          <ArrowRight size={18} />
          {isOpen ? t.offerHub.activePath : t.offerHub.unfold}
        </span>
      </button>
    );
  };

  const moduleOrder = ['individual', 'corporate', 'direct'];

  return (
    <section id="services" className="offer-hub-section">
      <div className="offer-hub-shell">
        <div className="offer-hub-header">
          <span className="tag-pill">{t.offerHub.eyebrow}</span>
          <h2>{t.offerHub.title}</h2>
          <p>{t.offerHub.subtitle}</p>
          <TactileAction
            type="button"
            className="readiness-check-trigger"
            onClick={() => {
              trackGoogleAnalyticsEvent('readiness_check_open', { source: 'offer_hub_header' });
              setIsReadinessOpen(true);
            }}
          >
            <Radar size={18} />
            {t.readinessCheck.cta}
            <ArrowRight size={18} />
          </TactileAction>
        </div>

        <div className="offer-path-strip">
          {t.offerHub.path.map((step, idx) => {
            const moduleId = moduleOrder[idx];
            const isActive = activeModule === moduleId;
            return (
              <button
                type="button"
                className={`offer-path-step ${isActive ? 'active' : ''}`}
                key={step.label}
                onClick={() => selectModule(moduleId)}
                aria-pressed={isActive}
              >
                <span>{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>{step.desc}</small>
                </div>
              </button>
            );
          })}
        </div>

        <div className="offer-module-list">
          <article id="ehs-starter-kit" className={`offer-module ${activeModule === 'individual' ? 'open' : ''}`}>
            {renderModuleButton('individual', Brain, t.offerHub.groups.individual, t.starterKit.price)}
            {activeModule === 'individual' && (
              <div className="offer-module-content">
                <div className="offer-content-main">
                  <h3>{t.starterKit.includedTitle}</h3>
                  <div className="offer-subcard-grid compact">
                    {t.starterKit.included.map((item, idx) => {
                      const KitIcon = [Brain, Route, ShieldCheck, Award][idx] || CheckCircle2;
                      return (
                        <div className="offer-subcard" key={item.title}>
                          <KitIcon size={20} />
                          <strong>{item.title}</strong>
                          <p>{item.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="offer-note-grid">
                    <div>
                      <ShieldCheck size={20} />
                      <strong>{t.starterKit.guardrailTitle}</strong>
                      <p>{t.starterKit.guardrailText}</p>
                    </div>
                    <div>
                      <GraduationCap size={20} />
                      <strong>{t.starterKit.nextStepTitle}</strong>
                      <p>{t.starterKit.nextStepText}</p>
                    </div>
                  </div>
                </div>
                <aside className="offer-action-panel">
                  <span>{t.starterKit.priceNote}</span>
                  <strong>{t.starterKit.price}</strong>
                  <p>{t.starterKit.deliveryNote}</p>
                  <TactileAction
                    type="button"
                    className="starter-kit-buy"
                    onClick={handleStarterKitCheckout}
                    disabled={pendingKitPayment}
                    aria-busy={pendingKitPayment}
                  >
                    <CreditCard size={18} />
                    {pendingKitPayment ? t.starterKit.pending : t.starterKit.primaryCta}
                    <ArrowRight size={18} />
                  </TactileAction>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="starter-kit-secondary"
                    onClick={() => trackGoogleAnalyticsEvent('linkedin_click', { source: 'starter_kit' })}
                  >
                    {t.starterKit.secondaryCta}
                    <ExternalLink size={16} />
                  </a>
                </aside>
                {(isVerifyingKit || kitSession || kitError) && (
                  <div className={`starter-kit-status glass-panel ${kitError ? 'warning' : ''}`}>
                    {isVerifyingKit ? (
                      <>
                        <Loader2 size={22} className="spin-icon" />
                        <span>{t.starterKit.verifying}</span>
                      </>
                    ) : kitError ? (
                      <>
                        <ShieldCheck size={22} />
                        <span>{kitError}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={22} />
                        <div>
                          <strong>{t.starterKit.successTitle}</strong>
                          <span>{t.starterKit.successText}</span>
                          {kitSession?.customerEmail && <small>{kitSession.customerEmail}</small>}
                          {kitSession?.downloadUrl && (
                            <a className="starter-kit-download" href={kitSession.downloadUrl} download>
                              <Download size={16} />
                              {t.starterKit.downloadCta}
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>

          <article id="corporate-diagnostic" className={`offer-module ${activeModule === 'corporate' ? 'open' : ''}`}>
            <span id="ai-advisory" className="offer-anchor" aria-hidden="true" />
            {renderModuleButton('corporate', Scale, t.offerHub.groups.corporate, t.corporateDiagnostic.ladder[1]?.price)}
            {activeModule === 'corporate' && (
              <div className="offer-module-content corporate">
                <div className="offer-two-column">
                  <div className="offer-suboffer">
                    <span>{t.corporateDiagnostic.eyebrow}</span>
                    <h3>{t.corporateDiagnostic.title}</h3>
                    <p>{t.corporateDiagnostic.subtitle}</p>
                    <div className="offer-action-row corporate-inline-actions">
                      <TactileAction
                        as="a"
                        href={CORPORATE_DISCOVERY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="corporate-primary"
                        onClick={() => trackGoogleAnalyticsEvent('book_discovery_call_click', {
                          source: 'corporate_diagnostic',
                        })}
                      >
                        <CalendarCheck size={18} />
                        {t.corporateDiagnostic.primaryCta}
                        <ArrowRight size={18} />
                      </TactileAction>
                      {t.advisory.brochures.map((brochure) => (
                        <a
                          href={brochure.href}
                          className="corporate-download"
                          download
                          key={brochure.href}
                          onClick={() => trackGoogleAnalyticsEvent('brochure_download', {
                            brochure_label: brochure.label,
                            brochure_href: brochure.href,
                            source: 'corporate_diagnostic',
                          })}
                        >
                          <Download size={17} />
                          {brochure.label}
                        </a>
                      ))}
                      <a
                        href={LINKEDIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="corporate-secondary"
                        onClick={() => trackGoogleAnalyticsEvent('linkedin_click', { source: 'corporate_diagnostic' })}
                      >
                        {t.corporateDiagnostic.linkedinCta}
                        <ExternalLink size={17} />
                      </a>
                    </div>
                    <div className="offer-mini-list">
                      <strong>{t.corporateDiagnostic.painTitle}</strong>
                      {t.corporateDiagnostic.painPoints.map((point) => (
                        <p key={point}><Siren size={15} /> {point}</p>
                      ))}
                    </div>
                  </div>
                  <div className="offer-suboffer">
                    <span>{t.advisory.eyebrow}</span>
                    <h3>{t.advisory.title}</h3>
                    <p>{t.advisory.flagship.desc}</p>
                    <div className="offer-mini-list">
                      <strong>{t.advisory.flagship.deliverableTitle}</strong>
                      {t.advisory.flagship.deliverables.slice(0, 4).map((deliverable) => (
                        <p key={deliverable}><CheckCircle2 size={15} /> {deliverable}</p>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="offer-subcard-grid">
                  {t.corporateDiagnostic.process.map((step, idx) => (
                    <div className="offer-subcard" key={step.title}>
                      <span className="offer-subcard-index">{String(idx + 1).padStart(2, '0')}</span>
                      <strong>{step.title}</strong>
                      <p>{step.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="corporate-ladder-grid simplified">
                  {t.corporateDiagnostic.ladder.map((item, idx) => (
                    <div className={`corporate-ladder-card ${idx === 1 ? 'featured' : ''}`} key={item.title}>
                      <span className="corporate-ladder-step">{item.step}</span>
                      <h4>{item.title}</h4>
                      <div className="corporate-ladder-meta">
                        <strong>{item.price}</strong>
                        <span>{item.timing}</span>
                      </div>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          <article id="consultation" className={`offer-module ${activeModule === 'direct' ? 'open' : ''}`}>
            {renderModuleButton('direct', CalendarCheck, t.offerHub.groups.direct, t.consultation.plans[1]?.price)}
            {activeModule === 'direct' && (
              <div className="offer-module-content direct">
                <div className="consultation-plans">
                  {t.consultation.plans.map((plan, idx) => (
                    <article
                      className={`consultation-plan ${idx === 1 ? 'featured' : ''} ${selectedPlanId === plan.id ? 'selected' : ''}`}
                      key={plan.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedPlanId === plan.id}
                      onClick={() => {
                        trackGoogleAnalyticsEvent('consultation_plan_select', {
                          plan_id: plan.id,
                          plan_title: plan.title,
                          plan_price: plan.price,
                          input: 'click',
                          source: 'offer_hub',
                        });
                        setSelectedPlanId(plan.id);
                      }}
                      onKeyDown={(event) => handlePlanKeyDown(event, plan.id)}
                    >
                      <div className="plan-meta">
                        <span>{plan.duration}</span>
                        {idx === 1 && <em>{t.consultation.recommended}</em>}
                      </div>
                      <h3>{plan.title}</h3>
                      <p>{plan.desc}</p>
                      <div className="plan-price">{plan.price}</div>
                      <ul>
                        {plan.outcomes.map((outcome, outcomeIdx) => (
                          <li key={outcomeIdx}>
                            <ShieldCheck size={16} />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                      <span className="plan-select-state">
                        {selectedPlanId === plan.id ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
                        {selectedPlanId === plan.id ? t.consultation.selectedLabel : t.consultation.selectLabel}
                      </span>
                    </article>
                  ))}
                </div>
                {selectedPlan && (
                  <div className="consultation-checkout-panel glass-panel">
                    <div>
                      <span>{t.consultation.checkoutEyebrow}</span>
                      <h3>{selectedPlan.title}</h3>
                      <p>{t.consultation.checkoutText}</p>
                      <div className="checkout-plan-meta">
                        <strong>{selectedPlan.price}</strong>
                        <small>{selectedPlan.duration}</small>
                      </div>
                    </div>
                    <TactileAction
                      type="button"
                      className="payment-btn"
                      onClick={() => handleCheckout(selectedPlan)}
                      disabled={pendingPlanId === selectedPlan.id}
                      aria-busy={pendingPlanId === selectedPlan.id}
                    >
                      <CreditCard size={18} />
                      {pendingPlanId === selectedPlan.id ? t.consultation.paymentPending : t.consultation.checkoutCta}
                      <ArrowRight size={18} />
                    </TactileAction>
                  </div>
                )}
                {paymentError && (
                  <div className="payment-error" role="status">
                    {paymentError}
                  </div>
                )}
                <div className="service-card-row">
                  <SafetyTrainingCard t={t} onCourseSelect={setSelectedTrainingCourse} />
                  <article className="service-card ai-video-card">
                    <div className="service-card-media ai-video-media">
                      <div className="service-card-icon">
                        <Clapperboard size={24} />
                      </div>
                      <span>{t.consultation.videoService.eyebrow}</span>
                    </div>
                    <div className="service-card-body">
                      <span className="service-card-eyebrow">{t.consultation.videoService.eyebrow}</span>
                      <h3>{t.consultation.videoService.title}</h3>
                      <p>{t.consultation.videoService.desc}</p>
                      <div className="ai-training-video-frame">
                        <video controls muted playsInline preload="metadata" poster="/safety_ai_training_video_poster.jpg">
                          <source src="/safety_ai_training_video.mp4" type="video/mp4" />
                        </video>
                      </div>
                      <TactileAction
                        as="a"
                        href={LINKEDIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="service-card-cta"
                        onClick={() => trackGoogleAnalyticsEvent('linkedin_click', { source: 'ai_training_video_card' })}
                      >
                        {t.consultation.videoService.cta}
                        <ArrowRight size={18} />
                      </TactileAction>
                    </div>
                  </article>
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
      <ReadinessCheckModal
        isOpen={isReadinessOpen}
        onClose={() => setIsReadinessOpen(false)}
        onRecommend={handleReadinessRecommendation}
        t={t}
      />
      <TrainingCourseModal course={selectedTrainingCourse} onClose={() => setSelectedTrainingCourse(null)} t={t} />
    </section>
  );
};

const ForwardDeployedProofSection = ({ t }) => (
  <section id="forward-engineer" className="forward-proof-section">
    <div className="forward-proof-shell">
      <div className="forward-proof-header">
        <span className="tag-pill">{t.forwardDeployed.eyebrow}</span>
        <h2>{t.forwardDeployed.title}</h2>
        <p>{t.forwardDeployed.subtitle}</p>
      </div>

      <div className="forward-proof-position glass-panel">
        <div>
          <span>{t.forwardDeployed.positionLabel}</span>
          <h3>{t.forwardDeployed.positionTitle}</h3>
          <p>{t.forwardDeployed.positionText}</p>
        </div>
        <div className="forward-proof-metrics">
          {t.forwardDeployed.metrics.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="forward-case-grid">
        {t.forwardDeployed.cases.map((caseItem) => {
          const Icon = FORWARD_CASE_ICONS[caseItem.icon] || ShieldCheck;
          const isInternalLink = caseItem.link?.startsWith('#');

          return (
            <article className="forward-case-card glass-panel" key={caseItem.title}>
              <div className="forward-case-media">
                <img src={caseItem.image} alt="" loading="lazy" decoding="async" />
                <div className="forward-case-icon">
                  <Icon size={22} />
                </div>
                <span>{caseItem.tag}</span>
              </div>
              <div className="forward-case-body">
                <h3>{caseItem.title}</h3>
                <p className="forward-case-outcome">{caseItem.outcome}</p>
                <div className="forward-case-proof">
                  <div>
                    <strong>{t.forwardDeployed.problemLabel}</strong>
                    <p>{caseItem.problem}</p>
                  </div>
                  <div>
                    <strong>{t.forwardDeployed.builtLabel}</strong>
                    <p>{caseItem.built}</p>
                  </div>
                  <div>
                    <strong>{t.forwardDeployed.impactLabel}</strong>
                    <p>{caseItem.impact}</p>
                  </div>
                </div>
                {caseItem.link ? (
                  <a
                    href={caseItem.link}
                    target={isInternalLink ? undefined : "_blank"}
                    rel={isInternalLink ? undefined : "noopener noreferrer"}
                    className="forward-case-link"
                  >
                    {caseItem.cta}
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <span className="forward-case-link forward-case-link-disabled" aria-disabled="true">
                    {caseItem.cta}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="forward-capability-strip">
        {t.forwardDeployed.capabilities.map((capability) => (
          <div key={capability.title}>
            <span>{capability.step}</span>
            <strong>{capability.title}</strong>
            <p>{capability.text}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const GEOAnswerSection = ({ t }) => {
  const evidenceIcons = [ShieldCheck, Route, CheckCircle2];

  return (
    <section id="ai-safety-answer" className="geo-answer-section" aria-labelledby="geo-answer-title">
      <div className="geo-answer-shell">
        <div className="geo-answer-header">
          <span className="tag-pill">{t.geo.eyebrow}</span>
          <h2 id="geo-answer-title">{t.geo.title}</h2>
          <p className="geo-answer-lead">{t.geo.answer}</p>
        </div>

        <div className="geo-evidence-heading">
          <h3>{t.geo.evidenceTitle}</h3>
          <span>{t.geo.sourceNote}</span>
        </div>
        <div className="geo-evidence-grid">
          {t.geo.evidence.map((item, index) => {
            const Icon = evidenceIcons[index] || CheckCircle2;
            return (
              <article className="geo-evidence-card" key={item.title}>
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>

        <nav className="geo-answer-links" aria-label={t.geo.evidenceTitle}>
          {t.geo.links.map((link) => (
            <a
              href={link.href}
              key={link.href}
              onClick={() => trackGoogleAnalyticsEvent('geo_answer_link_click', {
                target: link.href,
                language: document.documentElement.lang,
              })}
            >
              {link.label}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ))}
        </nav>

        <div id="faq" className="geo-faq-block">
          <div className="geo-faq-heading">
            <span className="tag-pill">FAQ</span>
            <h3>{t.geo.faqTitle}</h3>
          </div>
          <div className="geo-faq-list">
            {t.geo.faq.map((item) => (
              <details
                key={item.question}
                onToggle={(event) => {
                  if (event.currentTarget.open) {
                    trackGoogleAnalyticsEvent('faq_open', {
                      question: item.question,
                      source: 'homepage_geo',
                    });
                  }
                }}
              >
                <summary>
                  <span>{item.question}</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const SchedulerSection = ({ t }) => {
  const params = new URLSearchParams(window.location.search);
  const checkoutStatus = params.get('checkout');
  const sessionId = params.get('session_id');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [scheduleError, setScheduleError] = useState('');
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(checkoutStatus === 'success' && Boolean(sessionId));

  useEffect(() => {
    if (checkoutStatus !== 'success') return;

    requestAnimationFrame(() => {
      document.getElementById('schedule')?.scrollIntoView({ block: 'start' });
    });

    if (!sessionId) return;

    let isActive = true;
    const loadCheckoutSession = async () => {
      try {
        setIsLoadingSchedule(true);
        const response = await fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json();

        if (!response.ok || !data.paid) {
          throw new Error(data.message || t.scheduler.paymentLookupError);
        }

        if (isActive) {
          setSessionInfo(data);
          setScheduleError('');
          void trackVerifiedPurchase({
            sessionId,
            itemId: `consultation_${data.plan.id}`,
            itemName: data.plan.name,
            itemCategory: 'consultation',
            value: CONSULTATION_VALUES_HKD[data.plan.id],
          });
        }
      } catch (error) {
        if (isActive) {
          setScheduleError(error.message || t.scheduler.paymentLookupError);
        }
      } finally {
        if (isActive) {
          setIsLoadingSchedule(false);
        }
      }
    };

    loadCheckoutSession();
    return () => {
      isActive = false;
    };
  }, [checkoutStatus, sessionId, t.scheduler.paymentLookupError]);

  if (checkoutStatus !== 'success') return null;

  const schedulerUrl = buildSchedulerUrl(sessionInfo?.schedulerUrl, sessionInfo);
  const visibleScheduleError = scheduleError || (!sessionId ? t.scheduler.paymentLookupError : '');

  return (
    <section id="schedule" className="scheduler-section">
      <div className="scheduler-shell glass-panel">
        <div className="scheduler-header">
          <span className="tag-pill">{t.scheduler.eyebrow}</span>
          <h2>{t.scheduler.title}</h2>
          <p>{t.scheduler.subtitle}</p>
        </div>

        {isLoadingSchedule && (
          <div className="scheduler-state">
            <Loader2 size={26} className="spin-icon" />
            <span>{t.scheduler.verifying}</span>
          </div>
        )}

        {!isLoadingSchedule && visibleScheduleError && (
          <div className="scheduler-state warning">
            <ShieldCheck size={24} />
            <div>
              <strong>{t.scheduler.errorTitle}</strong>
              <p>{visibleScheduleError}</p>
              <p>{t.scheduler.retry}</p>
            </div>
          </div>
        )}

        {!isLoadingSchedule && sessionInfo && (
          <>
            <div className="scheduler-confirmation">
              <CheckCircle2 size={24} />
              <div>
                <strong>{t.scheduler.verifiedFor}</strong>
                <span>{sessionInfo.plan.name} · {sessionInfo.plan.duration} · {sessionInfo.plan.price}</span>
              </div>
              {sessionInfo.customerEmail && (
                <div>
                  <strong>{t.scheduler.buyerLabel}</strong>
                  <span>{sessionInfo.customerEmail}</span>
                </div>
              )}
            </div>

            {schedulerUrl ? (
              <div className="scheduler-calendar">
                <div className="scheduler-calendar-head">
                  <span>{t.scheduler.calendarReady}</span>
                  <a href={schedulerUrl} target="_blank" rel="noopener noreferrer">
                    {t.scheduler.openCalendar} <ExternalLink size={16} />
                  </a>
                </div>
                <iframe
                  src={schedulerUrl}
                  title={t.scheduler.iframeTitle}
                  className="scheduler-iframe"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="scheduler-state setup">
                <CalendarCheck size={24} />
                <div>
                  <strong>{t.scheduler.notConfiguredTitle}</strong>
                  <p>{t.scheduler.notConfiguredText}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

function App() {
  const [lang, setLang] = useState(() => {
    return getInitialPortfolioLanguage();
  });
  const manualLanguageRef = useRef(Boolean(getUrlPortfolioLanguage() || getManualPortfolioLanguage()));
  const t = locales[lang];

  useEffect(() => {
    document.title = t.seo.title;
    const canonicalUrl = lang === 'zh' ? `${SITE_URL}/zh/` : `${SITE_URL}/`;

    upsertMetaTag('name', 'description', t.seo.desc);
    upsertMetaTag('name', 'keywords', t.seo.keywords);
    upsertMetaTag('property', 'og:title', t.seo.title);
    upsertMetaTag('property', 'og:description', t.seo.desc);
    upsertMetaTag('property', 'og:type', 'website');
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', DEFAULT_SOCIAL_IMAGE);
    upsertMetaTag('property', 'og:image:alt', lang === 'zh' ? 'Safety Nexus AI 安全与 EHS 作品集视觉' : 'Safety Nexus AI safety and EHS portfolio visual');
    upsertMetaTag('property', 'og:locale', lang === 'zh' ? 'zh_CN' : 'en_US');
    upsertMetaTag('name', 'twitter:title', t.seo.title);
    upsertMetaTag('name', 'twitter:description', t.seo.desc);
    upsertMetaTag('name', 'twitter:url', canonicalUrl);
    upsertMetaTag('name', 'twitter:image', DEFAULT_SOCIAL_IMAGE);
    upsertMetaTag('name', 'twitter:image:alt', lang === 'zh' ? 'Safety Nexus AI 安全与 EHS 作品集视觉' : 'Safety Nexus AI safety and EHS portfolio visual');
    upsertLinkTag('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
    upsertLinkTag('link[rel="alternate"][hreflang="en"]', {
      rel: 'alternate',
      hreflang: 'en',
      href: `${SITE_URL}/`,
    });
    upsertLinkTag('link[rel="alternate"][hreflang="zh-Hans"]', {
      rel: 'alternate',
      hreflang: 'zh-Hans',
      href: `${SITE_URL}/zh/`,
    });
    upsertLinkTag('link[rel="alternate"][hreflang="x-default"]', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${SITE_URL}/`,
    });

    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
    syncHomepageStructuredData(t, lang);
  }, [lang, t]);

  useEffect(() => {
    installGoogleSearchConsoleMeta();
    installGoogleAnalytics();
    trackAiReferralVisit();
  }, []);

  useEffect(() => {
    trackGoogleAnalyticsPageView(lang);
  }, [lang, t.seo.title]);

  useEffect(() => {
    const isChinesePath = window.location.pathname === '/zh' || window.location.pathname.startsWith('/zh/');
    if (isChinesePath) return undefined;

    if (getUrlPortfolioLanguage() === 'zh' || getManualPortfolioLanguage() === 'zh') {
      window.location.replace('/zh/');
      return undefined;
    }

    if (manualLanguageRef.current) return undefined;

    let isActive = true;
    getVisitorDefaultLanguage().then((detectedLang) => {
      if (isActive && !manualLanguageRef.current && isSupportedLanguage(detectedLang)) {
        if (detectedLang === 'zh') {
          window.location.replace('/zh/');
        } else {
          setLang(detectedLang);
        }
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const mapRef = useRef(null);

  const [liked, setLiked] = useState(() => localStorage.getItem('portfolio_liked_v1') === 'true');
  const [likeCount, setLikeCount] = useState(() => Number(localStorage.getItem('portfolio_like_count_v1') || '0'));
  const [scrolled, setScrolled] = useState(false);
  const [heroImgIdx, setHeroImgIdx] = useState(0);

  const heroImages = [
    { url: "/alvin_headshot.png", title: "Alvin Liao professional portrait", location: "Hong Kong" },
    ...t.about.journeyHighlights
  ];
  const currentHeroImage = heroImages[heroImgIdx] || heroImages[0];
  const nextHeroImageUrl = heroImages[(heroImgIdx + 1) % heroImages.length]?.url;

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImgIdx(prev => (prev + 1) % heroImages.length);
    }, 4500); // Rotate every 4.5 seconds
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    if (!nextHeroImageUrl) return;
    const preload = new Image();
    preload.src = nextHeroImageUrl;
  }, [nextHeroImageUrl]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMapLoad = () => {
    if (mapRef.current && mapRef.current.contentDocument) {
      const svgDoc = mapRef.current.contentDocument;
      
      const style = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = `
        path, g.mainland { 
          fill: rgba(255, 255, 255, 0.08); 
          stroke: rgba(255, 255, 255, 0.2); 
          stroke-width: 0.5px; 
          transition: all 0.3s ease; 
        }
        path:hover, g.mainland:hover { 
          fill: rgba(0, 242, 254, 0.5); 
          cursor: pointer; 
        }
        #cn, #cn path, #kr, #kr path, #jp, #jp path, #sg, #sg path, 
        #gb, #gb path, #ie, #ie path, #fr, #fr path, #de, #de path, #it, #it path, #ch, #ch path, #be, #be path, #nl, #nl path, #dk, #dk path, #se, #se path, 
        #us, #us path, #mx, #mx path, #br, #br path, #cl, #cl path, #co, #co path, #pe, #pe path, #cr, #cr path, #pa, #pa path, #do, #do path, #ec, #ec path, #ar, #ar path, 
        #eg, #eg path, #ru, #ru path, #kz, #kz path, #ua, #ua path, #sn, #sn path,
        #au, #au path, #my, #my path, #na, #na path, #bd, #bd path, #za, #za path, #nz, #nz path {
          fill: rgba(0, 242, 254, 0.3);
          stroke: #00f2fe;
          stroke-width: 1px;
        }
      `;
      svgDoc.documentElement.appendChild(style);
    }
  };

  const handleLike = () => {
    const nextLiked = !liked;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setLikeCount(nextCount);
    localStorage.setItem('portfolio_liked_v1', String(nextLiked));
    localStorage.setItem('portfolio_like_count_v1', String(nextCount));
    trackGoogleAnalyticsEvent('portfolio_like_toggle', {
      liked: nextLiked,
      like_count: nextCount,
    });
  };

  const handleLanguageToggle = () => {
    const nextLang = lang === 'en' ? 'zh' : 'en';
    manualLanguageRef.current = true;
    saveManualPortfolioLanguage(nextLang);
    trackGoogleAnalyticsEvent('language_toggle', {
      next_language: nextLang,
    });
    window.location.assign(nextLang === 'zh' ? '/zh/' : '/');
  };

  return (
    <div className="layout">
      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled glass-panel' : ''}`}>
        <a className="logo" href={lang === 'zh' ? '/zh/' : '/'} aria-label="Safety Nexus home">SAFETY <span>NEXUS</span></a>
        <div className="nav-links">
          <a href="#projects">{t.nav.ecosystem}</a>
          <a href="#forward-engineer">{t.nav.proofCases}</a>
          <a href="#graph">{t.nav.knowledgeGraph}</a>
          <a href="#experience">{t.nav.globalJourney}</a>
          <a href="#about">{t.nav.professional}</a>
          <a href="#services">{t.nav.services}</a>
          <a href="#safety-training">{t.nav.training}</a>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="connect-btn"
            onClick={() => trackGoogleAnalyticsEvent('linkedin_click', { source: 'nav_connect' })}
          >
            {t.nav.connect}
          </a>
          <button
            type="button"
            className="lang-toggle-btn" 
            onClick={handleLanguageToggle}
            title={lang === 'zh' ? 'Switch to English' : '切换到简体中文'}
            aria-label={lang === 'zh' ? 'Switch to English' : '切换到简体中文'}
          >
            {t.nav.langToggle}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge glass-panel">{t.hero.badge}</div>
          <h1 className="gradient-text">{t.hero.title}</h1>
          <p className="hero-subtitle">{t.hero.subtitle}</p>
          <div className="hero-actions">
            <TactileAction
              as="a"
              href="#projects"
              className="btn-primary"
              onClick={() => trackGoogleAnalyticsEvent('hero_view_ecosystem_click', { source: 'hero' })}
            >
              {t.hero.btnPrimary} 
              <span className="btn-arrow">→</span>
            </TactileAction>
            <LikeBurstButton liked={liked} likeCount={likeCount} onToggle={handleLike} t={t} />
            <div className="system-status">
              <span className="pulse"></span> {t.hero.statusLabel} <span className="status-text">{t.hero.statusValue}</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div key={currentHeroImage.url} className="hero-slide active">
            <img
              src={currentHeroImage.url}
              alt={currentHeroImage.title}
              className="profile-img"
              loading="eager"
              decoding="async"
              fetchPriority={heroImgIdx === 0 ? 'high' : 'auto'}
            />
            {heroImgIdx !== 0 && (
              <div className="hero-slide-caption glass-panel">
                <p className="hero-slide-loc">{currentHeroImage.location}</p>
                <p className="hero-slide-title">{currentHeroImage.title}</p>
              </div>
            )}
            </div>
        </div>
      </section>

      <GEOAnswerSection t={t} />

      {/* Projects Grid */}
      <section id="projects" className="projects">
        <div className="section-header">
          <h2>{t.projects.sectionTitle.split(' ')[0]} <span>{t.projects.sectionTitle.split(' ').slice(1).join(' ')}</span></h2>
          <p>{t.projects.sectionSub}</p>
        </div>
          <SafetyNexusEngine />
      </section>

      <ForwardDeployedProofSection t={t} />
      
      {/* Knowledge Graph Section */}
      <section id="graph" className="knowledge-graph">
         <div className="section-header">
            <h2>{t.graph.sectionTitle.split(' ').slice(0, -1).join(' ')} <span>{t.graph.sectionTitle.split(' ').slice(-1)}</span></h2>
            <p>{t.graph.sectionSub}</p>
         </div>
         <div className="graph-container-wrapper glass-panel">
            <iframe 
              src="/v2_graph.html" 
              title="Knowledge Graph"
              className="graph-iframe"
              loading="lazy"
            ></iframe>
            <div className="graph-overlay-hint">
               <a href="/v2_graph.html" target="_blank" rel="noopener noreferrer" className="btn-sm">
                 {t.graph.fullscreenBtn} ↗
               </a>
            </div>
         </div>
      </section>

      {/* Experience Timeline */}
      <section id="experience" className="experience projects">
         <div className="section-header">
            <h2>{t.journey.sectionTitle.split(' ')[0]} <span>{t.journey.sectionTitle.split(' ').slice(1).join(' ')}</span></h2>
            <p>{t.journey.sectionSub}</p>
         </div>

         <div className="footprint-container glass-panel">
            <div className="footprint-header">
              <h3>{t.journey.footprintTitle.split(' ')[0]} <span>{t.journey.footprintTitle.split(' ').slice(1).join(' ')}</span></h3>
              <p>{t.journey.footprintSub}</p>
            </div>
            <div className="world-map-svg">
              <object 
                ref={mapRef}
                data="/world.svg" 
                type="image/svg+xml" 
                onLoad={handleMapLoad}
                className="interactive-map simple-map"
                aria-label="Global Footprint World Map"
                style={{ pointerEvents: 'auto', display: 'block', width: '100%', height: '100%' }}
              />
              <div className="country-grid">
                <div className="region-group">
                  <label>{t.journey.asia}</label>
                  <span>{t.journey.asiaList}</span>
                </div>
                <div className="region-group">
                  <label>{t.journey.europe}</label>
                  <span>{t.journey.europeList}</span>
                </div>
                <div className="region-group">
                  <label>{t.journey.americas}</label>
                  <span>{t.journey.americasList}</span>
                </div>
                <div className="region-group">
                  <label>{t.journey.africa}</label>
                  <span>{t.journey.africaList}</span>
                </div>
              </div>
            </div>
         </div>

         <div className="timeline">
            {t.journey.timeline.map((item, idx) => (
              <div 
                className="timeline-item glass-panel" 
                key={idx} 
                onClick={() => setSelectedExperience(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="year-pill">{item.year}</div>
                <div className="timeline-content">
                  <h4>{item.title}</h4>
                  <p className="org">{item.org}</p>
                  <p className="desc">{item.desc}</p>
                  <div className="view-details-btn">{t.journey.viewDetails}</div>
                </div>
              </div>
            ))}
         </div>
      </section>

      {/* Experience Modal */}
      {selectedExperience && (
        <div className="modal-overlay" onClick={() => setSelectedExperience(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedExperience(null)}>×</button>
            <div className="modal-header">
              <h2>{selectedExperience.title}</h2>
              <p className="modal-subtitle">{selectedExperience.org} | {selectedExperience.year}</p>
            </div>
            <div className="modal-body experience-modal-body">
              <h3>{t.journey.respTitle}</h3>
              {selectedExperience.details ? (
                <ul className="experience-bullet-list">
                  {selectedExperience.details.map((bullet, i) => {
                    const colonIndex = bullet.indexOf('：') > -1 ? bullet.indexOf('：') : bullet.indexOf(':');
                    if (colonIndex > -1) {
                      const tag = bullet.substring(0, colonIndex);
                      const desc = bullet.substring(colonIndex + 1);
                      return (
                        <li key={i}>
                          <strong>{tag}:</strong>{desc}
                        </li>
                      );
                    }
                    return <li key={i}>{bullet}</li>;
                  })}
                </ul>
              ) : (
                <p className="experience-desc">{selectedExperience.desc}</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="action-btn" onClick={() => setSelectedExperience(null)}>{t.journey.closeWindow}</button>
            </div>
          </div>
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} t={t} />

      {/* Resume & Credentials */}
      <section id="about" className="manifesto glass-panel resume-section">
        <div className="manifesto-content">
          <h2>{t.about.sectionTitle.split(' ').slice(0, -1).join(' ')} <span>{t.about.sectionTitle.split(' ').slice(-1)}</span></h2>
          
          <div className="identity-hero">
            <p className="identity-lead">
              {t.about.leadTextPrefix}<strong>{t.about.leadTextBold}</strong>{t.about.leadTextSuffix}
            </p>
            <div className="identity-stats">
              <div className="stat-box">
                <span className="stat-number">18+</span>
                <span className="stat-label">{t.about.stat1}</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">17+</span>
                <span className="stat-label">{t.about.stat2}</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">2.4<small>GW</small></span>
                <span className="stat-label">{t.about.stat3}</span>
              </div>
            </div>
            <p className="identity-sub">
              {t.about.subTextPrefix}<strong>{t.about.subTextBold}</strong>{t.about.subTextSuffix}
            </p>

            <div className="video-spotlight glass-panel">
              <div className="video-header">
                <h3>📽️ {t.about.aiVideoTitle}</h3>
                <p>{t.about.aiVideoDesc}</p>
              </div>
              <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                <iframe 
                  src="//player.bilibili.com/player.html?bvid=BV1aidmBbEaH&page=1&high_quality=1&danmaku=0" 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allowFullScreen
                  scrolling="no"
                  frameBorder="0"
                  sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
                  title="Safety Nexus AI Video"
                ></iframe>
              </div>
            </div>
          </div>

          <div className="credentials-bento">
            {/* Social Roles */}
            <div className="bento-box bento-social glass-card">
              <h3>🤝 {t.about.socialTitle}</h3>
              <div className="social-roles">
                {t.about.socialRoles.map((role, idx) => (
                  <div 
                    className={`role-item ${role.longContent ? 'clickable' : ''}`} 
                    key={idx}
                    onClick={() => role.longContent && setSelectedRole(role)}
                  >
                    <div className="role-icon">
                      {role.icon || (idx === 0 ? '🏛️' : idx === 1 ? '⚙️' : idx === 2 ? '🚀' : '🛡️')}
                    </div>
                    <div className="role-info">
                      <h4>{role.title}</h4>
                      <p>{role.org}</p>
                      <span>{role.desc}</span>
                      {role.longContent && <div className="role-view-more">{lang === 'en' ? 'View Details ➔' : '查看详情 ➔'}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bento-box bento-certs glass-card">
              <h3>🏆 {t.about.certTitle}</h3>
              <div className="cert-tags">
                {t.about.certList.map((cert, i) => (
                  <span key={i} className={`cert-tag ${cert.category}`}>
                    {cert.category === 'ai' ? '🤖 ' : cert.category === 'safety' ? '🛡️ ' : '📈 '}
                    {cert.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bento-box bento-edu glass-card">
              <h3>🎓 {t.about.eduTitle}</h3>
              <ul className="edu-list">
                <li>
                  <div className="edu-marker"></div>
                  <div className="edu-data">
                    <strong>Shanghai Jiao Tong University</strong>
                    <span>{t.about.eduMaster}</span>
                  </div>
                </li>
                <li>
                  <div className="edu-marker"></div>
                  <div className="edu-data">
                    <strong>Wuhan University</strong>
                    <span>{t.about.eduBachelor}</span>
                  </div>
                </li>
                <li>
                  <div className="edu-marker"></div>
                  <div className="edu-data">
                    <strong>Naval University of Engineering</strong>
                    <span>{t.about.eduJoint}</span>
                  </div>
                </li>
              </ul>
              <div className="languages-box">
                <div className="lang-tags">
                  {t.about.languages.map((l, i) => <span key={i}>{l}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Modal */}
      <RoleModal role={selectedRole} onClose={() => setSelectedRole(null)} t={t} />

      <OfferPathwaySection t={t} />
      <SchedulerSection t={t} />

      <footer>
        <p>
          © 2026 <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Alvin Liao</a> | {t.footerLabel} | <a href={lang === 'zh' ? '/zh/insights' : '/insights'} style={{ color: 'inherit', textDecoration: 'underline' }}>{lang === 'zh' ? 'AI 安全洞察' : 'AI Safety Insights'}</a>
        </p>
        <small className="motion-credit">
          {lang === 'zh' ? '触感交互模式参考 Kinetics，由 Csaba Kissi 创作。' : 'Tactile interaction patterns adapted from Kinetics by Csaba Kissi.'}{' '}
          <a href="https://github.com/ckissi/kinetics" target="_blank" rel="noopener noreferrer">Source</a>
        </small>
      </footer>
    </div>
  );
}

export default App;
