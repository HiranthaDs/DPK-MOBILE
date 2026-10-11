import { CONFIG } from '../config';

export const SHEET_SPACE = '     ';
export const DEFAULT_ADMIN_PASSWORD = 'DPK@2026';

export function sheetSafeText(value) {
  return String(value ?? '')
    .replace(/\r\n|\r|\n/g, SHEET_SPACE)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

function sanitizeDeep(value) {
  if (typeof value === 'string') return sheetSafeText(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeDeep(item)]));
  }
  return value;
}

export async function saveProductToSheet(product, accessKey, createOnly = false) {
  if (!CONFIG.adminApiUrl) throw new Error('Add VITE_GOOGLE_APPS_SCRIPT_URL to connect product management.');
  if (!accessKey.trim()) throw new Error('Enter the admin access key.');
  const response = await fetch(CONFIG.adminApiUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'upsertProduct', accessKey, createOnly: Boolean(createOnly), product: sanitizeDeep(product) }),
  });
  if (!response.ok) throw new Error(`The product service returned HTTP ${response.status}.`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'The product could not be saved.');
  return result;
}

export async function authenticateAdmin(accessKey) {
  if (!accessKey) throw new Error('Enter the admin password.');
  if (!CONFIG.adminApiUrl) {
    if (accessKey !== DEFAULT_ADMIN_PASSWORD) throw new Error('The admin password is incorrect.');
    return { ok: true, setupMode: true };
  }
  const response = await fetch(CONFIG.adminApiUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'authenticate', accessKey }),
  });
  if (!response.ok) throw new Error(`The admin service returned HTTP ${response.status}.`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'The admin password is incorrect.');
  return result;
}

export async function fetchAdminProducts(accessKey) {
  if (!CONFIG.adminApiUrl) return [];
  const response = await fetch(CONFIG.adminApiUrl, {
    method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'listProducts', accessKey }),
  });
  if (!response.ok) throw new Error(`The admin service returned HTTP ${response.status}.`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'Products could not be loaded for management.');
  return Array.isArray(result.products) ? result.products : [];
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(file);
  });
}

export async function uploadProductImage(file, accessKey, productId = 'PRODUCT') {
  if (!CONFIG.adminApiUrl) throw new Error('Connect VITE_GOOGLE_APPS_SCRIPT_URL before uploading images.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)) throw new Error('Upload a JPG, PNG or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5 MB.`);
  const data = await readImageFile(file);
  const response = await fetch(CONFIG.adminApiUrl, {
    method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'uploadImage', accessKey, file: { name: file.name, mimeType: file.type, data, productId } }),
  });
  if (!response.ok) throw new Error(`The image service returned HTTP ${response.status}.`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || `${file.name} could not be uploaded.`);
  return result;
}

export async function archiveProductInSheet(productId, accessKey) {
  if (!CONFIG.adminApiUrl) throw new Error('Add VITE_GOOGLE_APPS_SCRIPT_URL to connect product management.');
  const response = await fetch(CONFIG.adminApiUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'archiveProduct', accessKey, productId: sheetSafeText(productId) }),
  });
  if (!response.ok) throw new Error(`The product service returned HTTP ${response.status}.`);
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'The product could not be archived.');
  return result;
}
