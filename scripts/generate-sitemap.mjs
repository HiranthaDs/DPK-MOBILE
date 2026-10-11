import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { loadEnv } from 'vite';

const ROOT = process.cwd();
const SITE_URL = 'https://dpkmobile.com';
const env = loadEnv('production', ROOT, 'VITE_');
const API_URL = env.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwB24_AcbnX0Lc8Mla1lYbWUMC-K7MNfWZsCTiWrPplB5V7Lsj_4gwDdLfI2hPFdZIe/exec';
const CSV_URL = env.VITE_GOOGLE_SHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/1xHhAE25eK0-6R0D0ggxfjhzYZ__pNwEY4A-yotVwPz4/export?format=csv&gid=1048487281';

const corePages = [
  ['/', '1.0', 'daily'],
  ['/phones', '.9', 'daily'],
  ['/accessories', '.9', 'daily'],
  ['/tablets', '.8', 'daily'],
  ['/laptops', '.8', 'daily'],
  ['/smart-watches', '.8', 'daily'],
  ['/brands', '.8', 'weekly'],
  ['/stores/ja-ela', '.9', 'weekly'],
  ['/stores/kandana', '.9', 'weekly'],
  ['/about', '.7', 'monthly'],
  ['/shop', '.8', 'daily'],
];

function brandSlug(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

function validDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : date.toISOString().slice(0, 10);
}

function isPublic(product) {
  return product?.Product_ID && product?.Product_Name
    && !/(^|[-_\s])(test|sample|dummy)([-_\s]|$)/i.test(`${product.Product_ID} ${product.Product_Name}`)
    && !/inactive|hidden|deleted|draft|disabled|archived/i.test(String(product.Status || ''));
}

function normalizeSheetRow(row) {
  let data = {};
  try {
    data = JSON.parse(row?.['Data(json)'] || '{}');
  } catch {
    data = {};
  }
  return {
    ...row,
    ...data,
    Product_ID: row?.Product_ID || data.Product_ID || '',
    Description: row?.Description || data.Description || '',
    Timestamp: row?.Timestamp || row?.Timestampup || data.Timestamp || data.Timestampup || '',
  };
}

async function fetchCatalog() {
  try {
    const url = new URL(API_URL);
    url.searchParams.set('action', 'catalog');
    const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Catalog API returned ${response.status}`);
    const payload = await response.json();
    if (!payload?.products?.length) throw new Error('Catalog API returned no products');
    return payload.products.filter(isPublic);
  } catch (apiError) {
    console.warn(`Sitemap: live API unavailable (${apiError.message}); trying the published catalog.`);
    try {
      const response = await fetch(CSV_URL, { signal: AbortSignal.timeout(12_000) });
      if (!response.ok) throw new Error(`CSV returned ${response.status}`);
      const parsed = Papa.parse(await response.text(), { header: true, skipEmptyLines: 'greedy' });
      return parsed.data.map(normalizeSheetRow).filter(isPublic);
    } catch (csvError) {
      console.warn(`Sitemap: catalog unavailable (${csvError.message}); generating core URLs only.`);
      return [];
    }
  }
}

function xmlEscape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

const products = await fetchCatalog();
const today = new Date().toISOString().slice(0, 10);
const urls = corePages.map(([path, priority, changefreq]) => ({ path, priority, changefreq, lastmod: today }));
const brands = [...new Set(products.map((product) => product.Brand).filter(Boolean))];
brands.forEach((brand) => urls.push({ path: `/brands/${encodeURIComponent(brandSlug(brand))}.html`, priority: '.7', changefreq: 'daily', lastmod: today }));
products.forEach((product) => urls.push({
  path: `/product/${encodeURIComponent(product.Product_ID)}`,
  priority: '.7',
  changefreq: 'daily',
  lastmod: validDate(product.Timestamp || product.Timestampup) || today,
}));

const unique = [...new Map(urls.map((entry) => [entry.path, entry])).values()];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map((entry) => `  <url>
    <loc>${xmlEscape(`${SITE_URL}${entry.path}`)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

await mkdir(resolve(ROOT, 'public'), { recursive: true });
await writeFile(resolve(ROOT, 'public', 'sitemap.xml'), sitemap, 'utf8');
console.log(`Sitemap: wrote ${unique.length} URLs (${products.length} products).`);
