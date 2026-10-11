import { test as base, expect } from '@playwright/test';
import { loadEnv } from 'vite';
import Papa from 'papaparse';

const configuredSheet = process.env.VITE_GOOGLE_SHEET_CSV_URL || loadEnv('development', process.cwd(), 'VITE_').VITE_GOOGLE_SHEET_CSV_URL;
const image = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="white"/><rect x="130" y="45" width="140" height="290" rx="20" fill="#333"/><rect x="140" y="65" width="120" height="245" rx="12" fill="#ffad42"/></svg>';

function makeCatalog() {
  const columns = ['Product_ID', 'Product_Name', 'Product_Type', 'Brand', 'Price', 'Discount_Price', 'Stock_Qty', 'Status', 'Condition', 'Image_URL1', 'Image_URL2', 'Timestamp', 'Data(json)'];
  const rows = [];
  for (const [brand, count] of [['Apple', 30], ['Samsung', 20], ['Google', 15]]) {
    for (let index = 1; index <= count; index += 1) {
      const number = String(index).padStart(2, '0');
      const id = `${brand.toLowerCase()}-${number}`;
      const price = 100_000 + index * 1000;
      const brokenImages = id === 'apple-02';
      const data = id === 'apple-01' ? { Description: 'A Google Sheet description for this regular catalog product.', variants: [
        { ram: '6GB', rom: '128GB', color: 'Black', price: 100_000, stockQty: 0 },
        { ram: '8GB', rom: '256GB', color: 'Blue', price: 120_000, stockQty: 2 },
      ] } : id === 'apple-04' ? { Description: 'A separate Google Sheet description for iPhone 18 Pro Max.', Display_Details: 'This sheet text must never replace the hardcoded modern-device profile.' } : {};
      rows.push([
        id, id === 'apple-03' ? 'Apple iPhone 16 Pro' : id === 'apple-04' ? 'Apple iPhone 18 Pro Max' : `${brand} Test ${brand === 'Google' ? 'Accessory' : 'Phone'} ${number}`,
        brand === 'Google' ? 'Accessories' : 'Mobile', index % 2 ? brand : brand.toUpperCase(),
        price, index % 2 === 0 ? price - 5000 : '', id === 'apple-30' ? 0 : 5,
        'Active', 'Brand New', brokenImages ? '/test-images/broken-a.svg' : `/test-images/${id}.svg`,
        brokenImages ? '/test-images/broken-b.svg' : '', `2026-09-${Math.min(index, 28).toString().padStart(2, '0')}`, JSON.stringify(data),
      ]);
    }
  }
  const cell = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return [columns, ...rows].map((row) => row.map(cell).join(',')).join('\n');
}

const catalogCsv = makeCatalog();
const catalogProducts = Papa.parse(catalogCsv, { header: true, skipEmptyLines: 'greedy' }).data;

async function mockAdminApi(page, onSave = () => {}) {
  await page.route('https://script.google.com/macros/s/**/exec', async (route) => {
    const request = JSON.parse(route.request().postData() || '{}');
    if (request.action === 'authenticate') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: request.accessKey === 'DPK@2026' }) });
    if (request.action === 'listProducts') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, products: [] }) });
    if (request.action === 'upsertProduct') {
      onSave(request.product, request);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, action: 'created', productId: request.product.Product_ID }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
}

const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route((url) => {
      if (!configuredSheet) return url.hostname === 'docs.google.com' && url.pathname.startsWith('/spreadsheets/');
      const expected = new URL(configuredSheet);
      return url.origin === expected.origin && url.pathname === expected.pathname;
    }, (route) => route.fulfill({ status: 200, contentType: 'text/csv; charset=utf-8', body: catalogCsv }));
    await page.route('https://script.google.com/macros/s/**/exec*', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, products: catalogProducts, sheet: 'Products' }),
        });
      }
      return route.fallback();
    });
    await page.route('**/test-images/**', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: image }));
    await page.route('https://www.apple.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: image }));
    await use(page);
    expect(errors, 'The storefront should not throw uncaught browser errors').toEqual([]);
  },
});

test('developer credit is present at the bottom of every page', async ({ page }) => {
  for (const path of ['/', '/shop', '/brands', '/about', '/cart', '/admin-key.html', '/missing-page']) {
    await page.goto(path);
    const credit = page.locator('.footer-credit');
    await expect(credit).toContainText('Website designed and developed by');
    await expect(credit.getByRole('link', { name: 'HICH WEB' })).toHaveAttribute('href', 'https://www.hichweb.com');
    await expect(credit.getByRole('link', { name: 'www.hichweb.com' })).toHaveAttribute('href', 'https://www.hichweb.com');
    await expect(credit.getByRole('link', { name: '0714112113' })).toHaveAttribute('href', 'tel:0714112113');
  }
});

test('SEO exposes canonical local-business pages and crawl controls', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('DPK Mobile | Phone Shop in Ja-Ela & Kandana');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://dpkmobile.com/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://dpkmobile.com/');
  const siteSchema = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
  expect(siteSchema['@graph'].filter((item) => item['@type'] === 'ElectronicsStore')).toHaveLength(2);

  await page.goto('/stores/ja-ela');
  await expect(page.getByRole('heading', { level: 1, name: /Phone shop in Ja-Ela/i })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://dpkmobile.com/stores/ja-ela');
  const locationSchema = JSON.parse(await page.locator('#page-structured-data').textContent());
  expect(locationSchema.some((item) => item['@type'] === 'ElectronicsStore' && item.name === 'DPK Mobile Ja-Ela')).toBeTruthy();

  await page.goto('/phones');
  await expect(page).toHaveTitle('Mobile Phones in Ja-Ela & Kandana | DPK Mobile');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://dpkmobile.com/phones');

  await page.goto('/shop?q=iphone');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex, follow/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://dpkmobile.com/shop');

  const robots = await page.request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: https://dpkmobile.com/sitemap.xml');
  const sitemap = await page.request.get('/sitemap.xml');
  expect(await sitemap.text()).toContain('<loc>https://dpkmobile.com/stores/ja-ela</loc>');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/stores/kandana');
  await expect(page.getByRole('heading', { level: 1, name: /Phone shop in Kandana/i })).toBeVisible();
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(mobileOverflow).toBeLessThanOrEqual(1);
});

test('product pages publish product and offer structured data', async ({ page }) => {
  await page.goto('/product/apple-01');
  await expect(page).toHaveTitle('Apple Test Phone 01 Price in Sri Lanka | DPK Mobile');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://dpkmobile.com/product/apple-01');
  const pageSchema = JSON.parse(await page.locator('#page-structured-data').textContent());
  const product = pageSchema.find((item) => item['@type'] === 'Product');
  expect(product.name).toBe('Apple Test Phone 01');
  expect(product.offers.priceCurrency).toBe('LKR');
  expect(product.offers.availability).toBe('https://schema.org/InStock');
});

test('the live Apps Script catalog replaces stale published-sheet data', async ({ page }) => {
  await page.route('https://script.google.com/macros/s/**/exec*', (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'GET' && url.searchParams.get('action') === 'catalog') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          products: [{
            Product_ID: 'FRESHCATALOGITEM',
            Product_Name: 'Fresh Apps Script Product',
            Product_Type: 'Mobile',
            Category: 'Mobile',
            Brand: 'Apple',
            Status: 'Active',
            images: ['/test-images/fresh.svg', '/test-images/fresh-2.svg'],
            variants: [{ color: 'Blue', price: 250000, stockQty: 2 }],
          }],
        }),
      });
    }
    return route.fallback();
  });
  await page.goto('/shop');
  await expect(page.getByRole('heading', { name: 'Fresh Apps Script Product', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Apple Test Phone 01', exact: true })).toHaveCount(0);
});

test('hero artwork shows a shimmer skeleton until its image is ready', async ({ page }) => {
  let releaseImage;
  const imageGate = new Promise((resolve) => { releaseImage = resolve; });
  await page.route('**/test-images/apple-01.svg', async (route) => {
    await imageGate;
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: image });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const heroImage = page.locator('.feature-device img');
  const skeleton = page.locator('.feature-device-skeleton');
  await expect(page.locator('.feature-device > svg')).toHaveCount(0);
  await expect(skeleton).toBeVisible();
  await expect(heroImage).toHaveClass(/is-loading/);
  releaseImage();
  await expect(heroImage).toHaveClass(/is-loaded/);
  await expect(skeleton).toBeHidden();
});

test('the storefront falls back only to the explicit Products tab when the API is unavailable', async ({ page }) => {
  await page.route('https://script.google.com/macros/s/**/exec*', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ ok: false }),
  }));
  expect(new URL(configuredSheet).searchParams.get('gid')).toBe('1048487281');
  await page.goto('/shop');
  await expect(page.getByRole('heading', { name: 'Apple Test Phone 01', exact: true })).toBeVisible();
});

test('brand logos open their own collection and pagination mounts at most 24 products', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Shop Apple', exact: true }).click();
  await expect(page).toHaveURL(/\/brands\/apple\.html$/);
  await expect(page.getByRole('heading', { name: 'Apple collection', exact: true })).toBeVisible();

  const firstPage = page.getByLabel('Products, page 1 of 2', { exact: true });
  await expect(firstPage.getByRole('article')).toHaveCount(24);
  const names = await firstPage.getByRole('heading', { level: 3 }).allTextContents();
  expect(names.every((name) => name.startsWith('Apple '))).toBe(true);
  await expect(page.getByText('Showing 1–24 of 30 products', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page).toHaveURL(/\/brands\/apple\.html\?page=2$/);
  await expect(page.getByLabel('Products, page 2 of 2', { exact: true }).getByRole('article')).toHaveCount(6);
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.goBack();
  await expect(firstPage.getByRole('article')).toHaveCount(24);

  // Direct loading and refreshing an .html collection URL must resolve too.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Apple collection', exact: true })).toBeVisible();
  await expect(firstPage.getByRole('article')).toHaveCount(24);
});

test('search is case insensitive and browser history restores filter state', async ({ page }) => {
  await page.goto('/shop');
  await expect(page.getByLabel('Products, page 1 of 3', { exact: true }).getByRole('article')).toHaveCount(24);
  await page.getByRole('combobox', { name: 'Filter by brand' }).selectOption('Samsung');
  await expect(page.getByLabel('Products, page 1 of 1', { exact: true }).getByRole('article')).toHaveCount(20);
  await page.getByRole('searchbox', { name: 'Search catalog' }).fill('sAmSuNg 03');
  await expect(page.getByLabel('Products, page 1 of 1', { exact: true }).getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Samsung Test Phone 03', exact: true })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole('searchbox', { name: 'Search catalog' })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Filter by brand' })).toHaveValue('All');
  await expect(page.getByLabel('Products, page 1 of 3', { exact: true }).getByRole('article')).toHaveCount(24);
  await page.goForward();
  await expect(page.getByRole('searchbox', { name: 'Search catalog' })).toHaveValue('sAmSuNg 03');
  await expect(page.getByRole('combobox', { name: 'Filter by brand' })).toHaveValue('Samsung');
  await expect(page.getByRole('heading', { name: 'Samsung Test Phone 03', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.getByLabel('Products, page 1 of 1', { exact: true }).getByRole('article')).toHaveCount(20);
});

test('header search suggests live products and supports keyboard selection', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('combobox', { name: 'Search all products' });
  await search.fill('iPhone 16');
  const suggestions = page.getByRole('listbox', { name: 'Product suggestions' });
  await expect(suggestions).toBeVisible();
  await expect(suggestions.getByRole('option').filter({ hasText: 'Apple iPhone 16 Pro' })).toBeVisible();
  await expect(suggestions.getByText(/See all results for/)).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page).toHaveURL(/\/product\/apple-03$/);
  await expect(page.getByRole('heading', { name: 'Apple iPhone 16 Pro', exact: true, level: 1 })).toBeVisible();
});

test('selected variants reach the cart and quantity changes survive a reload', async ({ page }) => {
  await page.goto('/product/apple-01');
  await expect(page.getByRole('heading', { name: 'Apple Test Phone 01', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('.detail-information')).toContainText('A Google Sheet description for this regular catalog product.');
  await expect(page.locator('.extended-details')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /6GB.*128GB.*Black/ })).toBeDisabled();
  const option = page.getByRole('button', { name: /8GB.*256GB.*Blue/ });
  await option.click();
  await expect(option).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.getByRole('link', { name: 'Shopping cart, 1 items', exact: true }).click();

  const cartItem = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Apple Test Phone 01', exact: true }) });
  await expect(cartItem).toContainText('8GB · 256GB · Blue');
  await expect(cartItem).toContainText(/120,000/);
  await cartItem.getByRole('button', { name: 'Increase quantity' }).click();
  await expect(page.getByRole('link', { name: 'Shopping cart, 2 items', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Shopping cart, 2 items', exact: true })).toBeVisible();
  await expect(cartItem).toContainText('8GB · 256GB · Blue');
  await cartItem.getByRole('button', { name: 'Decrease quantity' }).click();
  await expect(page.getByRole('link', { name: 'Shopping cart, 1 items', exact: true })).toBeVisible();
  await cartItem.getByRole('button', { name: 'Remove Apple Test Phone 01', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your cart is empty.', exact: true })).toBeVisible();
});

test('explicitly sold-out products cannot be added to the cart', async ({ page }) => {
  await page.goto('/product/apple-30');
  await expect(page.getByRole('heading', { name: 'Apple Test Phone 30', exact: true, level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Out of stock', exact: true })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Shopping cart, 0 items', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ask on WhatsApp', exact: true })).toHaveAttribute('href', /https:\/\/wa\.me\//);
});

test('mobile shopping fits the viewport and navigation supports keyboard dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Shop Apple', exact: true })).toBeVisible();
  const whatsapp = page.getByRole('link', { name: 'Chat with DPK Mobile on WhatsApp' });
  await expect(whatsapp).toBeVisible();
  const whatsappBox = await whatsapp.boundingBox();
  expect(whatsappBox.width).toBeLessThan(135);
  await expect(page.getByRole('heading', { name: 'What are you looking for?', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Shop Mobile', exact: true })).toBeVisible();
  const brandCounts = page.locator('.brand-tile > span:last-child:not(.brand-logo)');
  await expect(brandCounts.first()).toBeVisible();
  const brandCountStyles = await brandCounts.evaluateAll((items) => items.map((item) => ({
    text: item.textContent.trim(),
    whiteSpace: getComputedStyle(item).whiteSpace,
    height: item.getBoundingClientRect().height,
  })));
  expect(brandCountStyles.filter((item) => /\d+ products/.test(item.text)).every((item) => item.whiteSpace === 'nowrap' && item.height <= 12)).toBe(true);
  const expectNoOverflow = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  };
  await expectNoOverflow();
  const trigger = page.getByRole('button', { name: 'Open navigation menu', exact: true });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('button', { name: 'Close navigation menu', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();

  await trigger.click();
  await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Accessories', exact: true }).click();
  await expect(page).toHaveURL(/\/accessories$/);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByLabel('Products, page 1 of 1', { exact: true }).getByRole('article')).toHaveCount(15);
  await expectNoOverflow();
  await page.getByRole('button', { name: /Filter products/ }).click();
  await expect(page.getByRole('complementary', { name: 'Product filters' })).toBeVisible();
  await expectNoOverflow();
  await page.goto('/product/apple-01');
  await expect(page.getByRole('heading', { name: 'Apple Test Phone 01', exact: true, level: 1 })).toBeVisible();
  await expectNoOverflow();
});

test('broken image alternatives terminate at a working local placeholder', async ({ page }) => {
  const attempts = new Map();
  await page.route('**/test-images/broken-*.svg', (route) => {
    const url = route.request().url();
    attempts.set(url, (attempts.get(url) || 0) + 1);
    return route.fulfill({ status: 404, contentType: 'text/plain', body: 'Missing test image' });
  });
  await page.goto('/product/apple-02');
  const mainImage = page.getByRole('img', { name: 'Apple Test Phone 02, view 1', exact: true });
  await expect(mainImage).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect.poll(() => mainImage.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  expect(attempts.size).toBe(2);
  expect([...attempts.values()].every((count) => count <= 2)).toBe(true);
  const finalSource = await mainImage.getAttribute('src');
  // Even a terminal image failure must not reassign its source and recurse.
  await mainImage.dispatchEvent('error');
  await mainImage.dispatchEvent('error');
  await expect(mainImage).toHaveAttribute('src', finalSource);
  expect([...attempts.values()].every((count) => count <= 2)).toBe(true);
});

test('product cards offer direct add and buy actions', async ({ page }) => {
  await page.goto('/shop');
  const product = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Apple iPhone 16 Pro', exact: true }) });
  await expect(product.getByText('Add to cart', { exact: true })).toBeVisible();
  await expect(product.getByText('Buy now', { exact: true })).toBeVisible();
  await product.getByRole('button', { name: 'Buy Apple iPhone 16 Pro now', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Apple iPhone 16 Pro', exact: true })).toBeVisible();
});

test('new model families receive one continuous long-form product story and sheet writes flatten line breaks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/product/apple-04');
  await expect(page.getByRole('heading', { name: 'A closer look at Apple iPhone 18 Pro Max.', exact: true })).toBeVisible();
  await expect(page.locator('.extended-details__device img')).toHaveAttribute('src', /^https:\/\/www\.apple\.com\//);
  await expect(page.locator('.extended-details__device img')).not.toHaveAttribute('src', /test-images|drive\.google/);
  const highlights = page.locator('.extended-details__highlights strong');
  await expect(highlights).toHaveCount(4);
  for (const highlight of await highlights.all()) await expect(highlight).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Display & design', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Camera system', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Connectivity & durability', exact: true })).toHaveCount(0);
  await expect(page.locator('.detail-information')).toContainText('A separate Google Sheet description for iPhone 18 Pro Max.');
  await expect(page.locator('.extended-details')).not.toContainText('This sheet text must never replace the hardcoded modern-device profile.');
  await expect(page.locator('.extended-details__grid')).toHaveCount(0);
  await page.getByRole('button', { name: /See all details/i }).click();
  await expect(page.getByRole('heading', { name: 'Connectivity & durability', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Software, privacy & safety', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Professional rear video', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Show fewer details/i })).toHaveAttribute('aria-expanded', 'true');
  const closerLookWords = await page.locator('.extended-details').innerText().then((text) => text.trim().split(/\s+/).length);
  expect(closerLookWords).toBeGreaterThan(1500);
  await expect(page.getByRole('link', { name: /official specifications/i })).toHaveAttribute('href', /apple\.com/);
  const sanitized = await page.evaluate(async () => {
    const { sheetSafeText } = await import('/src/lib/adminApi.js');
    return sheetSafeText('First\nSecond\r\nThird\rFourth');
  });
  expect(sanitized).toBe('First     Second     Third     Fourth');
  const iphone16Highlights = await page.evaluate(async () => {
    const { getExtendedProductContent } = await import('/src/lib/productDetails.js');
    return getExtendedProductContent({ Product_Name: 'Apple iPhone 16', category: 'Mobile' }).highlights;
  });
  expect(iphone16Highlights).toEqual([
    '6.1-inch Super Retina XDR OLED with Dynamic Island and Camera Control',
    'A18 chip with 6-core CPU and 5-core GPU',
    '48MP Fusion Main and 12MP Ultra Wide cameras',
    'Up to 22 hours of video playback',
  ]);
});

test('admin saves the five required fields and previews desktop and mobile storefronts', async ({ page }) => {
  let savedProduct;
  let savedRequest;
  await mockAdminApi(page, (product, request) => { savedProduct = product; savedRequest = request; });
  await page.goto('/admin-key.html');
  await expect(page.getByRole('heading', { name: 'Welcome back.', exact: true })).toBeVisible();
  await page.getByLabel('Admin password').fill('wrong-password');
  await page.getByRole('button', { name: /Open admin portal/ }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
  await page.getByLabel('Admin password').fill('DPK@2026');
  await page.getByRole('button', { name: /Open admin portal/ }).click();
  await expect(page.getByRole('heading', { name: 'Product management.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Add new product/ }).click();
  const editor = page.getByRole('dialog', { name: 'Add a new product' });
  await expect(editor).toBeVisible();
  const generatedId = await editor.getByLabel('Product ID').inputValue();
  expect(generatedId).toMatch(/^[A-Z]{16}$/);
  await editor.getByRole('button', { name: 'New random ID', exact: true }).click();
  const regeneratedId = await editor.getByLabel('Product ID').inputValue();
  expect(regeneratedId).toMatch(/^[A-Z]{16}$/);
  expect(regeneratedId).not.toBe(generatedId);
  await editor.getByLabel('Product name').fill('Apple iPhone 17 Pro');
  await expect(editor.getByLabel(/^Brand/)).toHaveAttribute('list', 'product-brand-suggestions');
  await editor.getByLabel(/^Brand/).fill('Apple');
  await editor.getByLabel(/^Category/).fill('Mobile');
  await editor.getByLabel(/^Product type/).fill('Smartphone');
  await editor.getByLabel('Warranty').fill('AppleCare+');
  await expect(editor.getByLabel('Product ID')).toHaveValue(regeneratedId);
  await editor.getByRole('button', { name: /Continue/ }).click();
  await expect(editor.getByRole('heading', { name: 'Options, price and stock', exact: true })).toBeVisible();
  await expect(editor.getByText('Option 1', { exact: true })).toBeVisible();
  await expect(editor.getByText('Card price (LKR)', { exact: true })).toHaveCount(0);
  await editor.getByLabel('RAM').fill('8GB');
  await editor.getByLabel('Colour').fill('Midnight Teal');
  await editor.getByLabel('Colour').press('Enter');
  await editor.getByLabel('Colour').fill('Blue');
  await editor.getByLabel('Colour').press('Enter');
  await expect(editor.getByText('Midnight Teal', { exact: true })).toBeVisible();
  await editor.getByRole('button', { name: /Add option/ }).click();
  await expect(editor.getByText('Option 2', { exact: true })).toBeVisible();
  await editor.getByRole('button', { name: /Continue/ }).click();
  await expect(editor.getByRole('heading', { name: 'Product images', exact: true })).toBeVisible();
  await editor.getByRole('button', { name: /Continue/ }).click();
  await expect(editor.getByText('Desktop website', { exact: true })).toBeVisible();
  await expect(editor.getByText('Mobile website', { exact: true })).toBeVisible();
  await expect(editor.getByText(/optional details are missing/)).toBeVisible();
  await editor.getByRole('button', { name: /Save to Google Sheets/ }).click();
  await expect(editor).not.toBeVisible();
  expect(savedProduct).toMatchObject({
    Product_ID: regeneratedId, Product_Name: 'Apple iPhone 17 Pro',
    Brand: 'Apple', Category: 'Mobile', Product_Type: 'Smartphone', Warranty: 'AppleCare+', Price: 0,
  });
  expect(savedProduct.variants[0].color).toBe('Midnight Teal, Blue');
  expect(savedProduct.variants[0]).not.toHaveProperty('cardAmount');
  expect(savedRequest.createOnly).toBe(true);
});

test('admin sign-in and guided editor fit a mobile viewport', async ({ page }) => {
  await mockAdminApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin-key.html');
  await page.getByLabel('Admin password').fill('DPK@2026');
  await page.getByRole('button', { name: /Open admin portal/ }).click();
  const beforeEditor = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await page.getByRole('button', { name: /Add new product/ }).click();
  const editor = page.getByRole('dialog', { name: 'Add a new product' });
  await expect(editor).toBeVisible();
  await editor.getByRole('button', { name: 'Review', exact: true }).click();
  await expect(editor.getByText('Mobile website', { exact: true })).toBeVisible();
  await expect(editor.getByText('Desktop website', { exact: true })).not.toBeVisible();
  const saveButton = editor.getByRole('button', { name: /Save to Google Sheets/ });
  await expect(saveButton).toBeVisible();
  const editorLayout = await editor.evaluate((dialog) => {
    const footer = dialog.querySelector('.advanced-product-editor__footer').getBoundingClientRect();
    const button = dialog.querySelector('.admin-button--publish').getBoundingClientRect();
    return { viewportHeight: window.innerHeight, footerTop: footer.top, footerBottom: footer.bottom, buttonTop: button.top, buttonBottom: button.bottom };
  });
  expect(editorLayout.footerTop).toBeGreaterThanOrEqual(0);
  expect(editorLayout.footerBottom).toBeLessThanOrEqual(editorLayout.viewportHeight + 1);
  expect(editorLayout.buttonTop).toBeGreaterThanOrEqual(0);
  expect(editorLayout.buttonBottom).toBeLessThanOrEqual(editorLayout.viewportHeight + 1);
  const afterEditor = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(beforeEditor).toBeLessThanOrEqual(1);
  expect(afterEditor).toBeLessThanOrEqual(1);
});
