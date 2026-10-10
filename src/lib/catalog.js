import Papa from 'papaparse';
import { CONFIG, PLACEHOLDER_IMAGE } from '../config';

const DB_NAME = 'dpk-mobile-catalog';
const STORE_NAME = 'catalog';
const CACHE_SCHEMA_VERSION = 7;
const CACHE_KEY = `schema-${CACHE_SCHEMA_VERSION}:${CONFIG.adminApiUrl || 'no-api'}:${CONFIG.csvUrl}`;

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
export const cleanText = (value) => value !== null && typeof value === 'object' ? '' : String(value ?? '').trim();
export const lower = (value) => cleanText(value).toLowerCase();

export function numberFrom(value) {
  if ((typeof value !== 'string' && typeof value !== 'number') || value === '') return 0;
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPrice(value) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numberFrom(value));
}

function valueFor(row, ...names) {
  const entries = Object.entries(row || {});
  for (const name of names) {
    const key = entries.find(([candidate]) => lower(candidate).replace(/[\s_()]/g, '') === lower(name).replace(/[\s_()]/g, ''))?.[0];
    if (key && row[key] !== undefined) return row[key];
  }
  return '';
}

function parseJsonCell(row) {
  const raw = cleanText(valueFor(row, 'Data(json)', 'Data JSON', 'jsonData', 'metaJson'));
  if (!raw) return {};
  const candidates = [raw, raw.replace(/^"|"$/g, ''), raw.replace(/""/g, '"')];
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isRecord(parsed)) return parsed;
    } catch {
      // Try the next common Google Sheets encoding.
    }
  }
  return {};
}

export function normalizeVariant(variant) {
  const price = numberFrom(variant?.price ?? variant?.Price ?? variant?.regularPrice);
  const discountPrice = numberFrom(variant?.discountPrice ?? variant?.Discount_Price ?? variant?.offerPrice);
  const stockValue = variant?.stockQty ?? variant?.Stock_Qty ?? variant?.stock;
  const hasStockValue = stockValue !== undefined && stockValue !== null && stockValue !== '';
  return {
    ram: cleanText(variant?.ram ?? variant?.RAM),
    rom: cleanText(variant?.rom ?? variant?.ROM ?? variant?.storage),
    color: cleanText(variant?.color ?? variant?.Color),
    sku: cleanText(variant?.sku ?? variant?.SKU),
    price,
    discountPrice: discountPrice > 0 && discountPrice < price ? discountPrice : 0,
    stockQty: hasStockValue ? Math.max(0, Math.floor(numberFrom(stockValue))) : null,
  };
}

function normalizeDetailSection(section) {
  if (!isRecord(section)) return null;
  const title = cleanText(section.title ?? section.Title);
  const body = cleanText(section.body ?? section.Body ?? section.description);
  if (!title || !body) return null;
  return {
    title,
    body,
    eyebrow: cleanText(section.eyebrow ?? section.Eyebrow),
    image: cleanText(section.image ?? section.Image_URL) ? optimizeImage(section.image ?? section.Image_URL) : '',
  };
}

export function categoryFor(product) {
  const type = cleanText(product?.Product_Type);
  const raw = type && lower(type) !== 'other' ? type : cleanText(product?.Category) || 'Other';
  const value = lower(raw);
  if (/accessor|headphone|earphone|earbud|airpod|headset|charger|charging|cable|adapter|power\s?bank|\bcases?\b|cover|protector/.test(value)) return 'Accessories';
  if (/ipad|tablet/.test(value)) return 'Tablets';
  if (/laptop|macbook|notebook/.test(value)) return 'Laptops';
  if (/watch|wearable/.test(value)) return 'Wearables';
  if (/\b(?:mobiles?|phones?|smartphones?|iphones?)\b/.test(value)) return 'Mobile';
  return raw || 'Other';
}

export function optimizeImage(url) {
  const clean = cleanText(url);
  if (!clean) return PLACEHOLDER_IMAGE;
  if (clean.includes('drive.google.com')) {
    const id = clean.match(/[?&]id=([^&]+)/)?.[1] || clean.match(/\/file\/d\/([^/]+)/)?.[1] || clean.match(/thumbnail\?id=([^&]+)/)?.[1];
    if (id) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
  }
  return clean;
}

export function getPricing(product, selectedVariant = null) {
  const productVariants = Array.isArray(product?.variants) ? product.variants : [];
  const availableVariants = productVariants.filter((variant) => variant?.stockQty === null || variant?.stockQty === undefined || variant.stockQty > 0);
  const variants = selectedVariant ? [selectedVariant] : availableVariants.length ? availableVariants : productVariants;
  const prices = variants
    .filter(isRecord)
    .map((variant) => {
      const regular = numberFrom(variant.price);
      const discount = numberFrom(variant.discountPrice);
      const current = discount > 0 && discount < regular ? discount : regular;
      return { regular, current };
    })
    .filter((item) => item.current > 0);

  if (prices.length) {
    const cheapest = prices.reduce((best, item) => (item.current < best.current ? item : best));
    return {
      current: cheapest.current,
      regular: cheapest.regular,
      discounted: cheapest.regular > cheapest.current,
      from: !selectedVariant && prices.length > 1,
      percent: cheapest.regular > cheapest.current ? Math.round((1 - cheapest.current / cheapest.regular) * 100) : 0,
    };
  }

  const regular = numberFrom(product?.Price);
  const discount = numberFrom(product?.Discount_Price);
  const current = discount > 0 && discount < regular ? discount : regular;
  return {
    current,
    regular,
    discounted: regular > current,
    from: false,
    percent: regular > current ? Math.round((1 - current / regular) * 100) : 0,
  };
}

function normalizeRow(row, index) {
  const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().replace(/^\uFEFF/, ''), value]));
  const json = parseJsonCell(values);
  const source = { ...values, ...json };
  const sourceImages = Array.isArray(source.images) ? source.images : [];
  const images = Array.from({ length: 8 }, (_, imageIndex) =>
    cleanText(source[`Image_URL${imageIndex + 1}`] || values[`Image_URL${imageIndex + 1}`] || sourceImages[imageIndex]),
  ).filter(Boolean);
  const variants = Array.isArray(source.variants)
    ? source.variants.filter(isRecord).map(normalizeVariant).filter((variant) => (
      variant.ram || variant.rom || variant.color || variant.sku
      || variant.price > 0 || variant.discountPrice > 0 || variant.stockQty !== null
    ))
    : [];
  const name = cleanText(source.Product_Name || source.name || source.title || source.ProductName);
  const id = cleanText(source.Product_ID || source.id || source.ID || `ROW-${index + 2}`);
  const stockText = cleanText(source.Stock_Qty ?? source.stock);
  const stockQuantity = Number.parseFloat(stockText.replace(/[^0-9.-]+/g, ''));
  const hasVariantStock = variants.some((variant) => variant.stockQty !== null);
  const variantStock = variants.reduce((total, variant) => total + (variant.stockQty || 0), 0);
  const product = {
    Product_ID: id,
    Product_Name: name,
    Product_Type: cleanText(source.Product_Type || source.type || source.Type || source.Category || source.category || 'Other'),
    Category: cleanText(source.Category || source.category),
    Brand: cleanText(source.Brand || source.brand),
    SKU: cleanText(source.SKU || source.sku),
    Model_Number: cleanText(source.Model_Number || source.model || source.Model),
    Condition: cleanText(source.Condition || source.condition || 'Brand New'),
    Warranty: cleanText(source.Warranty || source.warranty),
    Status: cleanText(source.Status || source.status || 'Active'),
    Stock_Qty: hasVariantStock ? variantStock : Number.isFinite(stockQuantity) ? Math.max(0, Math.floor(stockQuantity)) : null,
    Price: numberFrom(source.Price || source.price),
    Discount_Price: numberFrom(source.Discount_Price || source.discountPrice),
    Featured: cleanText(source.Featured || source.featured),
    Description: cleanText(source.Description || source.description),
    Highlights: cleanText(source.Highlights || source.highlights),
    Display_Details: cleanText(source.Display_Details || source.displayDetails),
    Performance_Details: cleanText(source.Performance_Details || source.performanceDetails),
    Camera_Details: cleanText(source.Camera_Details || source.cameraDetails),
    Battery_Details: cleanText(source.Battery_Details || source.batteryDetails),
    Connectivity_Details: cleanText(source.Connectivity_Details || source.connectivityDetails),
    In_The_Box: cleanText(source.In_The_Box || source.inTheBox),
    GSM_Arena_URL: cleanText(source.GSM_Arena_URL || source.gsmArenaUrl),
    Timestamp: cleanText(source.Timestampup || values.Timestampup || source.Timestamp || values.Timestamp),
    Timestampup: cleanText(source.Timestampup || values.Timestampup || source.Timestamp || values.Timestamp),
    images,
    Image_URL1: images[0] || '',
    variants,
    detailSections: Array.isArray(source.detailSections)
      ? source.detailSections.map(normalizeDetailSection).filter(Boolean)
      : [],
  };
  product.category = categoryFor(product);
  product._searchText = lower([
    name,
    product.Brand,
    product.Product_Type,
    product.Category,
    product.Model_Number,
    product.SKU,
    product.Condition,
    ...variants.flatMap((variant) => [variant.ram, variant.rom, variant.color, variant.sku]),
  ].join(' '));
  return product;
}

export function normalizeProductRecord(input, index = 0) {
  const images = Array.isArray(input?.images) ? input.images : [];
  const imageColumns = Object.fromEntries(images.slice(0, 8).map((image, imageIndex) => [`Image_URL${imageIndex + 1}`, image]));
  return normalizeRow({ ...input, ...imageColumns, 'Data(json)': JSON.stringify(input || {}) }, index);
}

function isVisible(product) {
  if (!product.Product_Name || !product.Product_ID) return false;
  if (['unnamed product', 'undefined', 'null', '-'].includes(lower(product.Product_Name))) return false;
  return !/inactive|hidden|deleted|draft|disabled|archived/.test(lower(product.Status));
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw new DOMException('Catalog request cancelled.', 'AbortError');
}

function parseCsv(text, signal) {
  return new Promise((resolve, reject) => {
    throwIfAborted(signal);
    const onAbort = () => reject(new DOMException('Catalog request cancelled.', 'AbortError'));
    signal?.addEventListener('abort', onAbort, { once: true });
    const finish = (callback, result) => {
      signal?.removeEventListener('abort', onAbort);
      callback(result);
    };
    try {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: 'greedy',
        worker: text.length > 250_000 && Papa.WORKERS_SUPPORTED,
        complete: (result) => finish(resolve, result.data || []),
        error: (error) => finish(reject, error),
      });
    } catch (error) {
      finish(reject, error);
    }
  });
}

async function normalizeInChunks(rows, signal) {
  const output = [];
  const seen = new Set();
  const CHUNK_SIZE = 250;
  for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
    throwIfAborted(signal);
    const chunk = rows.slice(start, start + CHUNK_SIZE);
    chunk.forEach((row, offset) => {
      if (!isRecord(row)) return;
      const product = normalizeRow(row, start + offset);
      if (isVisible(product) && !seen.has(product.Product_ID)) {
        seen.add(product.Product_ID);
        output.push(product);
      }
    });
    if (start + CHUNK_SIZE < rows.length) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return output;
}

function openCache() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return resolve(null);
    const request = indexedDB.open(DB_NAME, 1);
    let settled = false;
    const finish = (db = null, error = null) => {
      if (settled) {
        db?.close();
        return;
      }
      settled = true;
      clearTimeout(timeout);
      error ? reject(error) : resolve(db);
    };
    // A blocked or unavailable cache must never prevent the live catalog loading.
    const timeout = setTimeout(() => finish(), 2000);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => finish(request.result);
    request.onerror = () => finish(null, request.error);
    request.onblocked = () => finish();
  });
}

export async function readCatalogCache() {
  let db;
  try {
    db = await openCache();
    if (!db) return null;
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME);
      const request = transaction.objectStore(STORE_NAME).get(CACHE_KEY);
      transaction.oncomplete = () => {
        const cached = request.result;
        const valid = Array.isArray(cached?.products) && cached.products.every((product) =>
          isRecord(product) && typeof product.Product_ID === 'string' && typeof product.Product_Name === 'string'
          && typeof product._searchText === 'string' && Array.isArray(product.variants) && Array.isArray(product.images),
        );
        resolve(valid ? cached : null);
      };
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

async function writeCatalogCache(products) {
  let db;
  try {
    db = await openCache();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
      transaction.objectStore(STORE_NAME).put({ products, savedAt: Date.now() }, CACHE_KEY);
    });
  } catch {
    // Storage permissions, private mode, and quota errors do not affect shopping.
  } finally {
    db?.close();
  }
}

async function fetchAppsScriptCatalog(signal) {
  if (!CONFIG.adminApiUrl) return null;
  throwIfAborted(signal);
  const url = new URL(CONFIG.adminApiUrl);
  url.searchParams.set('action', 'catalog');
  url.searchParams.set('_', Date.now().toString(36));
  const response = await fetch(url, { signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error(`The live catalog returned HTTP ${response.status}.`);
  const payload = await response.json();
  if (!payload?.ok || !Array.isArray(payload.products)) {
    throw new Error('The Apps Script deployment does not yet provide the public catalog action.');
  }
  const products = await normalizeInChunks(payload.products, signal);
  throwIfAborted(signal);
  void writeCatalogCache(products);
  return products;
}

async function fetchPublishedSheetCatalog(signal) {
  throwIfAborted(signal);
  const url = new URL(CONFIG.csvUrl);
  url.searchParams.set('_', Date.now().toString(36));
  const response = await fetch(url, { signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error(`The published Google Sheet returned HTTP ${response.status}.`);
  const text = await response.text();
  if (/^\s*(?:<!doctype\s+html|<html\b)/i.test(text)) throw new Error('The Google Sheet returned HTML instead of CSV.');
  const rows = await parseCsv(text, signal);
  const products = await normalizeInChunks(rows, signal);
  throwIfAborted(signal);
  if (!products.length) throw new Error('No active products were found in the published sheet.');
  void writeCatalogCache(products);
  return products;
}

export async function fetchCatalog(signal) {
  let liveError;
  if (CONFIG.adminApiUrl) {
    try {
      return await fetchAppsScriptCatalog(signal);
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      liveError = error;
    }
  }

  try {
    // This URL is pinned to the Products tab by its numeric gid. It can never
    // silently switch to Sheet1 when the Apps Script deployment is outdated.
    return await fetchPublishedSheetCatalog(signal);
  } catch (sheetError) {
    if (sheetError?.name === 'AbortError') throw sheetError;
    if (liveError) throw new Error(`${liveError.message} ${sheetError.message}`);
    throw sheetError;
  }
}
