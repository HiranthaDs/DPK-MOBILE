import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCatalog } from './CatalogContext';
import { brandSlug, canonicalBrand, getCatalogBrands } from '../lib/brands';
import { defaultBrandLogo, suppliedBrandNames, validateBrandLogo } from '../lib/brandAssets';

const STORAGE_KEY = 'dpk-brand-settings-v1';
const BrandContext = createContext(null);
const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value);

function sanitizeSettings(value) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([slug, settings]) => (
    /^[\p{L}\p{N}-]+$/u.test(slug) && isRecord(settings)
    && typeof settings.displayName === 'string' && settings.displayName.trim().length > 0
    && settings.displayName.length <= 64 && typeof settings.visible === 'boolean'
    && typeof settings.logoUrl === 'string' && !validateBrandLogo(settings.logoUrl)
  )).map(([slug, settings]) => [slug, {
    displayName: settings.displayName.trim(), logoUrl: settings.logoUrl.trim(), visible: settings.visible,
  }]));
}

function readSettings() {
  try {
    return sanitizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return {};
  }
}

function resolveBrand(name, settings = {}, productCount = 0) {
  const canonicalName = canonicalBrand(name);
  const slug = brandSlug(canonicalName);
  const override = settings[slug];
  return {
    name: canonicalName, slug, productCount,
    displayName: override?.displayName || canonicalName,
    logoUrl: override?.logoUrl || defaultBrandLogo(canonicalName),
    customLogoUrl: override?.logoUrl || '',
    visible: override?.visible !== false,
    customized: Boolean(override),
    hasSuppliedLogo: Boolean(defaultBrandLogo(canonicalName)),
  };
}

export function BrandProvider({ children }) {
  const { products } = useCatalog();
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    const updateFromStorage = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) setSettings(readSettings());
    };
    window.addEventListener('storage', updateFromStorage);
    return () => window.removeEventListener('storage', updateFromStorage);
  }, []);

  const counts = useMemo(() => {
    const result = new Map();
    products.forEach((product) => {
      const name = canonicalBrand(product.Brand);
      if (name) result.set(name, (result.get(name) || 0) + 1);
    });
    return result;
  }, [products]);

  const brands = useMemo(() => getCatalogBrands([...counts.keys(), ...suppliedBrandNames])
    .map((name) => resolveBrand(name, settings, counts.get(name) || 0)), [counts, settings]);

  const getBrand = useCallback((name) => resolveBrand(name, settings, counts.get(canonicalBrand(name)) || 0), [counts, settings]);

  const persist = useCallback((nextSettings) => {
    // Apply after a successful write so quota failures never show "saved".
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
    } catch {
      throw new Error('Your browser could not save these changes. Free some storage or use a smaller logo, then try again.');
    }
    setSettings(nextSettings);
  }, []);

  const saveBrand = useCallback((name, next) => {
    const displayName = String(next.displayName || '').trim().replace(/\s+/g, ' ');
    const logoUrl = String(next.logoUrl || '').trim();
    if (!displayName || displayName.length > 64) throw new Error('Enter a display name between 1 and 64 characters.');
    const logoError = validateBrandLogo(logoUrl);
    if (logoError) throw new Error(logoError);
    if (!brands.some((brand) => brand.name === canonicalBrand(name))) throw new Error('This brand is not in the brand library.');
    // Read at mutation time so changes made in another tab are preserved.
    persist({ ...readSettings(), [brandSlug(name)]: { displayName, logoUrl, visible: next.visible !== false } });
  }, [brands, persist]);

  const resetBrand = useCallback((name) => {
    const next = { ...readSettings() };
    delete next[brandSlug(name)];
    persist(next);
  }, [persist]);

  const exportSettings = useCallback(() => ({
    version: 1, exportedAt: new Date().toISOString(), scope: 'local-browser',
    brands: brands.map((brand) => ({
      canonicalName: brand.name, slug: brand.slug, displayName: brand.displayName,
      logoUrl: brand.logoUrl, visible: brand.visible,
    })),
  }), [brands]);

  const value = useMemo(() => ({ brands, getBrand, saveBrand, resetBrand, exportSettings }), [brands, getBrand, saveBrand, resetBrand, exportSettings]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrands() {
  const context = useContext(BrandContext);
  if (!context) throw new Error('useBrands must be used inside BrandProvider');
  return context;
}

// Also allow logos in isolated previews without mounting the catalog.
export function useBrand(name) {
  const context = useContext(BrandContext);
  return context ? context.getBrand(name) : resolveBrand(name);
}
