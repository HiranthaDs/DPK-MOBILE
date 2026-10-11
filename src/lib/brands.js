const BRAND_NAMES = [
  'Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Google', 'OnePlus', 'OPPO', 'vivo',
  'realme', 'HONOR', 'Huawei', 'Nokia', 'Nothing', 'Motorola', 'Sony', 'Spigen', 'JBL',
  'Anker', 'Baseus', 'UGREEN', 'Belkin', 'Soundcore', 'Amazfit', 'Porodo',
  'Green Lion', 'Tecno', 'Infinix', 'ASUS', 'Lenovo', 'HP', 'Dell', 'Acer',
  'Amazon', 'Aspor', 'ATB', 'BOYA', 'CMF', 'HMD', 'Hollyland', 'Kieslect',
  'Kingston', 'LDNIO', 'Philips', 'Plokama', 'Remax', 'SanDisk', 'Transcend',
  'WIWU', 'Yesido',
];

const compact = (value) => String(value ?? '').trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const knownBrands = new Map(BRAND_NAMES.map((name) => [compact(name), name]));
knownBrands.set('iphone', 'Apple');
knownBrands.set('appleiphone', 'Apple');
knownBrands.set('samsunggalaxy', 'Samsung');
knownBrands.set('googlepixel', 'Google');
knownBrands.set('mi', 'Xiaomi');

/** Keep Sheet spelling variations together without hard-coding the catalog. */
export function canonicalBrand(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return '';
  return knownBrands.get(compact(name)) || name.toLowerCase().replace(/(^|\s)\p{L}/gu, (letter) => letter.toUpperCase());
}

export function brandSlug(value) {
  return canonicalBrand(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

export function brandPath(value) {
  return `/brands/${encodeURIComponent(brandSlug(value))}.html`;
}

export function getCatalogBrands(values) {
  return [...new Set(values.map(canonicalBrand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function brandFromSlug(slug, values = []) {
  const requested = String(slug ?? '').replace(/\.html$/i, '').toLowerCase();
  return getCatalogBrands([...BRAND_NAMES, ...values]).find((brand) => brandSlug(brand) === requested)
    || canonicalBrand(requested.replace(/-/g, ' '));
}
