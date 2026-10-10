import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCatalog, normalizeProductRecord, readCatalogCache } from '../lib/catalog';

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('live');
  const controllerRef = useRef(null);
  const mountedRef = useRef(false);

  const load = useCallback(async ({ background = false } = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    let timedOut = false;
    const isCurrentRequest = () => mountedRef.current && controllerRef.current === controller;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 25_000);
    setError('');
    setLoading(!background);
    setRefreshing(background);
    try {
      const nextProducts = await fetchCatalog(controller.signal);
      if (!isCurrentRequest() || controller.signal.aborted) return;
      setProducts(nextProducts);
      setSource('live');
      setError('');
    } catch (loadError) {
      if (!isCurrentRequest()) return;
      if (timedOut) {
        setError('The catalog took too long to respond. Please try again.');
      } else if (!controller.signal.aborted) {
        setError(loadError?.message || 'The live catalog could not be loaded.');
      }
    } finally {
      clearTimeout(timeout);
      if (isCurrentRequest()) {
        controllerRef.current = null;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    (async () => {
      const cached = await readCatalogCache();
      if (!active) return;
      if (cached?.products?.length) {
        setProducts(cached.products);
        setSource('cache');
        setLoading(false);
        await load({ background: true });
      } else {
        await load();
      }
    })();
    return () => {
      active = false;
      mountedRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [load]);

  const productMap = useMemo(() => new Map(products.map((product) => [product.Product_ID, product])), [products]);
  const categories = useMemo(() => ['All', ...new Set(products.map((product) => product.category).filter(Boolean))], [products]);
  const brands = useMemo(() => [...new Set(products.map((product) => product.Brand).filter(Boolean))].sort(), [products]);

  const applyProductMutation = useCallback((rawProduct) => {
    const normalized = normalizeProductRecord(rawProduct);
    setProducts((current) => {
      const withoutProduct = current.filter((item) => item.Product_ID !== normalized.Product_ID);
      if (/inactive|hidden|deleted|draft|disabled|archived/.test(String(normalized.Status).toLowerCase())) return withoutProduct;
      return [normalized, ...withoutProduct];
    });
    setSource('live');
  }, []);

  const value = useMemo(() => ({
    products,
    productMap,
    categories,
    brands,
    loading,
    refreshing,
    error,
    source,
    retry: () => load({ background: products.length > 0 }),
    applyProductMutation,
  }), [products, productMap, categories, brands, loading, refreshing, error, source, load, applyProductMutation]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used inside CatalogProvider');
  return context;
}
