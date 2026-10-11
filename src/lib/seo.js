import { CONFIG } from '../config';

export const SITE_URL = CONFIG.siteUrl.replace(/\/$/, '');
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/Icon.png`;

const CATEGORY_ROUTES = {
  Mobile: '/phones',
  Tablets: '/tablets',
  Laptops: '/laptops',
  Wearables: '/smart-watches',
  Accessories: '/accessories',
};

export function categoryPath(category) {
  return CATEGORY_ROUTES[category] || `/shop?category=${encodeURIComponent(category)}`;
}

export function categoryFromPath(pathname) {
  const match = Object.entries(CATEGORY_ROUTES).find(([, path]) => path === pathname);
  return match?.[0] || '';
}

export function absoluteUrl(value, fallback = DEFAULT_SOCIAL_IMAGE) {
  if (!value || String(value).startsWith('data:')) return fallback;
  try {
    return new URL(value, `${SITE_URL}/`).href;
  } catch {
    return fallback;
  }
}

export function canonicalUrl(path = '/') {
  const normalized = path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`;
  return `${SITE_URL}${normalized}`;
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function storeSchema(store) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ElectronicsStore',
    '@id': `${canonicalUrl(`/stores/${store.slug}`)}#store`,
    name: store.name,
    url: canonicalUrl(`/stores/${store.slug}`),
    image: DEFAULT_SOCIAL_IMAGE,
    logo: DEFAULT_SOCIAL_IMAGE,
    telephone: CONFIG.phoneInternational,
    email: CONFIG.email,
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: store.streetAddress,
      addressLocality: store.town,
      ...(store.postalCode ? { postalCode: store.postalCode } : {}),
      addressRegion: 'Western Province',
      addressCountry: 'LK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: store.latitude,
      longitude: store.longitude,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapQuery)}`,
    areaServed: [store.town, 'Gampaha District', 'Sri Lanka'],
    currenciesAccepted: 'LKR',
  };
}

export function productSchema(product, pricing, soldOut = false) {
  if (!product) return null;
  const url = canonicalUrl(`/product/${encodeURIComponent(product.Product_ID)}`);
  const images = (product.images?.length ? product.images : [product.Image_URL1]).filter(Boolean).map((image) => absoluteUrl(image));
  const description = String(product.Description || `${product.Product_Name} available from DPK Mobile in Ja-Ela and Kandana.`).trim();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.Product_Name,
    url,
    description,
    image: [...new Set(images)],
    category: product.category || product.Product_Type,
    ...(product.Brand ? { brand: { '@type': 'Brand', name: product.Brand } } : {}),
    ...(product.SKU ? { sku: product.SKU } : {}),
    ...(product.Model_Number ? { mpn: product.Model_Number } : {}),
  };
  if (pricing?.current > 0) {
    schema.offers = {
      '@type': 'Offer',
      url,
      priceCurrency: 'LKR',
      price: Number(pricing.current).toFixed(2),
      availability: `https://schema.org/${soldOut ? 'OutOfStock' : 'InStock'}`,
      ...(product.Condition ? { itemCondition: `https://schema.org/${/used|pre.?owned/i.test(product.Condition) ? 'UsedCondition' : /refurb/i.test(product.Condition) ? 'RefurbishedCondition' : 'NewCondition'}` } : {}),
      seller: { '@id': `${SITE_URL}/#organization` },
    };
  }
  return schema;
}
