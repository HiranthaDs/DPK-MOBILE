import { useEffect } from 'react';
import { absoluteUrl, canonicalUrl, DEFAULT_SOCIAL_IMAGE } from '../lib/seo';

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel, href, hreflang = '') {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    if (hreflang) element.hreflang = hreflang;
    document.head.appendChild(element);
  }
  element.href = href;
}

export function useDocumentMeta(title, description, options = {}) {
  const structuredData = JSON.stringify((options.structuredData || []).filter(Boolean));
  useEffect(() => {
    document.title = title;
    const canonical = canonicalUrl(options.canonical || window.location.pathname);
    const image = absoluteUrl(options.image, DEFAULT_SOCIAL_IMAGE);
    const robots = options.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'googlebot', robots);
    upsertMeta('property', 'og:site_name', 'DPK Mobile');
    upsertMeta('property', 'og:locale', 'en_LK');
    upsertMeta('property', 'og:type', options.type || 'website');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:alt', options.imageAlt || 'DPK Mobile phone and technology store');
    upsertMeta('name', 'twitter:card', 'summary');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertLink('canonical', canonical);
    upsertLink('alternate', canonical, 'en-LK');
    upsertLink('alternate', canonical, 'x-default');

    const existingSchema = document.getElementById('page-structured-data');
    const schemas = JSON.parse(structuredData);
    if (schemas.length) {
      const script = existingSchema || document.createElement('script');
      script.id = 'page-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
      if (!existingSchema) document.head.appendChild(script);
    } else {
      existingSchema?.remove();
    }
  }, [description, options.canonical, options.image, options.imageAlt, options.robots, options.type, structuredData, title]);
}
