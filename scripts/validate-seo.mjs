import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SITE_ORIGIN = 'https://vibe-portfolio-dny.pages.dev';
const errors = [];
const warnings = [];

const walkHtml = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(path);
    return entry.isFile() && entry.name.endsWith('.html') ? [path] : [];
  }));
  return nested.flat();
};

const decodeText = (value = '') => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] || '';
const findMeta = (html, attribute, value) => tags(html, 'meta').find((tag) => attr(tag, attribute).toLowerCase() === value.toLowerCase());
const findLink = (html, rel) => tags(html, 'link').find((tag) => attr(tag, 'rel').toLowerCase() === rel.toLowerCase());

const files = [resolve(ROOT, 'index.html'), resolve(ROOT, 'zh/index.html'), ...(await walkHtml(resolve(ROOT, 'public')))];
const pages = [];

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const label = relative(ROOT, file);
  const robotsTag = findMeta(html, 'name', 'robots');
  const canonicalTag = findLink(html, 'canonical');
  const managed = Boolean(robotsTag || canonicalTag);
  if (!managed) continue;

  const robots = attr(robotsTag || '', 'content').toLowerCase();
  const indexable = !robots.includes('noindex');
  const title = decodeText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
  const description = attr(findMeta(html, 'name', 'description') || '', 'content').trim();
  const canonical = attr(canonicalTag || '', 'href');
  const language = attr(html.match(/<html\b[^>]*>/i)?.[0] || '', 'lang');
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const isReactEntry = label === 'index.html' || label === 'zh/index.html';

  if (!title) errors.push(`${label}: missing title`);
  if (indexable && !description) errors.push(`${label}: missing meta description`);
  if (indexable && !canonical) errors.push(`${label}: missing canonical`);
  if (indexable && !language) errors.push(`${label}: missing html lang`);
  if (indexable && !isReactEntry && h1Count !== 1) errors.push(`${label}: expected one H1, found ${h1Count}`);
  if (title.length > 68) warnings.push(`${label}: title is ${title.length} characters`);
  if (description.length > 170) warnings.push(`${label}: description is ${description.length} characters`);

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${label}: invalid JSON-LD (${error.message})`);
    }
  }

  const alternates = tags(html, 'link')
    .filter((tag) => attr(tag, 'rel').toLowerCase() === 'alternate' && attr(tag, 'hreflang'))
    .map((tag) => ({ language: attr(tag, 'hreflang'), href: attr(tag, 'href') }));

  pages.push({ label, indexable, canonical, alternates });
}

const canonicalPages = new Map(pages.filter((page) => page.indexable && page.canonical).map((page) => [page.canonical, page]));
if (canonicalPages.size !== pages.filter((page) => page.indexable && page.canonical).length) {
  errors.push('Duplicate canonical URLs detected');
}

for (const page of canonicalPages.values()) {
  for (const alternate of page.alternates) {
    if (!alternate.href.startsWith(SITE_ORIGIN) || alternate.language === 'x-default') continue;
    const target = canonicalPages.get(alternate.href);
    if (!target) continue;
    const reciprocal = target.alternates.some((candidate) => candidate.href === page.canonical);
    if (!reciprocal) errors.push(`${page.label}: hreflang target ${target.label} is not reciprocal`);
  }
}

const sitemap = await readFile(resolve(ROOT, 'public/sitemap.xml'), 'utf8');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
if ([...sitemapUrls].some((url) => url.includes('?lang='))) errors.push('sitemap.xml contains legacy query-language URLs');

for (const page of canonicalPages.values()) {
  if (page.canonical.startsWith(SITE_ORIGIN) && !sitemapUrls.has(page.canonical)) {
    errors.push(`${page.label}: canonical URL missing from sitemap.xml`);
  }
}

if (warnings.length) {
  console.warn(`SEO warnings (${warnings.length}):\n- ${warnings.join('\n- ')}`);
}

if (errors.length) {
  console.error(`SEO validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`SEO validation passed: ${canonicalPages.size} canonical pages, ${sitemapUrls.size} sitemap URLs, valid JSON-LD.`);
}
