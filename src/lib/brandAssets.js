import { brandSlug, canonicalBrand } from './brands';

// Logo originals supplied with this project are preserved outside build output.
const ASSET_FILES = {
  Amazon: 'amazon.webp', Anker: 'anker.webp', Aspor: 'aspor.webp', ATB: 'atb.webp',
  BOYA: 'boya.webp', CMF: 'cmf.webp', 'Green Lion': 'green-lion.webp', HMD: 'hmd.webp',
  Hollyland: 'hollyland.webp', HONOR: 'honor.svg', Infinix: 'infinix.webp', JBL: 'jbl.webp',
  Kieslect: 'kieslect.webp', Kingston: 'kingston.webp', LDNIO: 'ldnio.png', Nokia: 'nokia.webp',
  Philips: 'philips.webp', Plokama: 'plokama.webp', Porodo: 'porodo.webp', Redmi: 'redmi.png',
  Remax: 'remax.webp', SanDisk: 'sandisk.webp', Transcend: 'transcend.webp', UGREEN: 'ugreen.webp',
  WIWU: 'wiwu.webp', Xiaomi: 'xiaomi.webp', Yesido: 'yesido.webp',
};

export const suppliedBrandNames = Object.keys(ASSET_FILES);
export const suppliedBrandAssets = suppliedBrandNames.map((name) => ({
  name, slug: brandSlug(name), url: `/assets/brands/${ASSET_FILES[name]}`,
}));

export function defaultBrandLogo(brand) {
  const file = ASSET_FILES[canonicalBrand(brand)];
  return file ? `/assets/brands/${file}` : '';
}

export const MAX_LOGO_BYTES = 512 * 1024;
const MAX_DATA_LENGTH = Math.ceil(MAX_LOGO_BYTES / 3) * 4 + 100;

/** Custom logos are image-only data URLs, HTTPS URLs, or supplied asset paths. */
export function validateBrandLogo(value) {
  const logo = String(value || '').trim();
  if (!logo) return '';
  if (logo.startsWith('data:')) {
    if (logo.length > MAX_DATA_LENGTH) return 'Choose a logo smaller than 512 KB.';
    return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(logo)
      ? '' : 'Upload a PNG, JPG or WebP image.';
  }
  if (suppliedBrandAssets.some((asset) => asset.url === logo)) return '';
  if (logo.length > 2048) return 'The image URL must be shorter than 2,048 characters.';
  try {
    const url = new URL(logo);
    if (url.protocol !== 'https:' || url.username || url.password) return 'Use a public HTTPS image URL without credentials.';
    return '';
  } catch {
    return 'Enter a complete HTTPS image URL.';
  }
}
