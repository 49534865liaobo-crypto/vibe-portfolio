(() => {
  const upsertMeta = (attribute, key, content) => {
    if (!content) return;
    let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  const upsertLink = (selector, attributes) => {
    let tag = document.head.querySelector(selector);
    if (!tag) {
      tag = document.createElement('link');
      document.head.appendChild(tag);
    }
    Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value));
  };

  const ensureLink = (selector, attributes) => {
    if (document.head.querySelector(selector)) return;
    upsertLink(selector, attributes);
  };

  const getSafeLocation = () => {
    const url = new URL(window.location.href);
    ['session_id', 'payment_intent', 'payment_intent_client_secret', 'redirect_status']
      .forEach((param) => url.searchParams.delete(param));
    return {
      href: url.href,
      path: `${url.pathname}${url.search}${url.hash}`,
    };
  };

  const ensureShareMetadata = () => {
    const canonical = document.head.querySelector('link[rel="canonical"]')?.href;
    if (!canonical) return;

    const title = document.title;
    const description = document.head.querySelector('meta[name="description"]')?.content || '';
    const image = document.head.querySelector('meta[property="og:image"]')?.content || `${window.location.origin}/safety-nexus-og.jpg`;
    const imageAlt = `${title} | Safety Nexus`;

    const pageType = canonical.includes('/insights/') || canonical.includes('/proof-cases/') ? 'article' : 'website';
    upsertMeta('property', 'og:type', pageType);
    upsertMeta('property', 'og:site_name', 'Safety Nexus');
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:alt', imageAlt);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:url', canonical);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertMeta('name', 'twitter:image:alt', imageAlt);
    ensureLink('link[rel="alternate"][hreflang="en"]', {
      rel: 'alternate',
      hreflang: 'en',
      href: canonical,
    });
    ensureLink('link[rel="alternate"][hreflang="x-default"]', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: canonical,
    });
  };

  ensureShareMetadata();

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

  const detectAiSource = () => {
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

  const trackAiReferral = () => {
    const source = detectAiSource();
    if (!source || typeof window.gtag !== 'function') return;

    const dedupeKey = `safety_nexus_ai_referral:${source}:${window.location.pathname}`;
    try {
      if (sessionStorage.getItem(dedupeKey)) return;
      sessionStorage.setItem(dedupeKey, 'sent');
    } catch {
      // Analytics can continue without storage access.
    }

    const location = getSafeLocation();
    window.gtag('event', 'ai_referral_visit', {
      ai_source: source,
      traffic_source_type: 'ai_assistant',
      page_location: location.href,
      page_path: location.path,
      transport_type: 'beacon',
    });
  };

  trackAiReferral();

  const getEventFromLink = (link) => {
    const href = link.href || '';
    if (href.includes('cal.com/bo-liao-etzveq')) return 'book_discovery_call_click';
    if (href.includes('linkedin.com/in/ir-bo-alvin-liao-2b237b95')) return 'linkedin_click';
    if (link.hasAttribute('download') || href.includes('/brochures/')) return 'brochure_download';
    if (href.includes('/insights')) return 'insight_article_click';
    if (href.includes('/proof-cases/')) return 'proof_case_click';
    if (href.includes('#ehs-starter-kit')) return 'starter_kit_interest_click';
    return '';
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a');
    if (!link || typeof window.gtag !== 'function') return;

    const eventName = getEventFromLink(link);
    if (!eventName) return;

    const location = getSafeLocation();
    window.gtag('event', eventName, {
      link_url: link.href,
      link_text: link.textContent?.trim().slice(0, 120) || '',
      page_location: location.href,
      page_path: location.path,
      transport_type: 'beacon',
    });
  });
})();
