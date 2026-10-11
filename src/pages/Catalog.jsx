import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import CatalogNotice from '../components/CatalogNotice';
import { ProductGrid, ProductSkeletons } from '../components/ProductGrid';
import { useCatalog } from '../context/CatalogContext';
import { useBrands } from '../context/BrandContext';
import { formatPrice, getPricing, lower } from '../lib/catalog';
import { brandFromSlug, canonicalBrand, getCatalogBrands } from '../lib/brands';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { breadcrumbSchema, categoryFromPath, categoryPath } from '../lib/seo';
import '../styles/catalog.css';

const SORT_OPTIONS = [
  ['featured', 'Recommended'], ['newest', 'Newest arrivals'],
  ['price-low', 'Price: low to high'], ['price-high', 'Price: high to low'], ['name', 'Name: A–Z'],
];

const CATEGORY_SEO = {
  Mobile: ['Mobile Phones in Ja-Ela & Kandana', 'Shop mobile phones at DPK Mobile in Ja-Ela and Kandana. Compare smartphones, prices, condition, warranty information and current availability.'],
  Tablets: ['Tablets & iPads in Ja-Ela & Kandana', 'Shop tablets and iPads from DPK Mobile in Ja-Ela and Kandana. Browse current models, prices and available options.'],
  Laptops: ['Laptops in Ja-Ela & Kandana', 'Shop laptops at DPK Mobile in Ja-Ela and Kandana. Explore current models and ask our local team about price, specifications and availability.'],
  Wearables: ['Smart Watches in Ja-Ela & Kandana', 'Shop smart watches and wearables at DPK Mobile in Ja-Ela and Kandana. Compare current options from our live catalog.'],
  Accessories: ['Mobile Accessories in Ja-Ela & Kandana', 'Shop chargers, power banks, cases, audio products and mobile accessories at DPK Mobile in Ja-Ela and Kandana.'],
};

export default function Catalog() {
  const { products, brands, loading } = useCatalog();
  const { getBrand } = useBrands();
  const location = useLocation();
  const navigate = useNavigate();
  const { brandSlug: routeSlug } = useParams();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  const filterDialogRef = useRef(null);
  const filterTriggerRef = useRef(null);
  const availableBrands = useMemo(() => getCatalogBrands(brands), [brands]);
  const brandSettings = useMemo(() => availableBrands.map(getBrand), [availableBrands, getBrand]);
  const visibleBrands = useMemo(() => brandSettings.filter((item) => item.visible), [brandSettings]);
  const routeBrand = routeSlug ? brandFromSlug(routeSlug, availableBrands) : '';
  const routeBrandDisplay = routeBrand ? getBrand(routeBrand).displayName : '';
  const query = params.get('q') || '';
  const pathCategory = categoryFromPath(location.pathname);
  const category = pathCategory || params.get('category') || 'All';
  const productType = params.get('type') || 'All';
  const brand = routeBrand || canonicalBrand(params.get('brand')) || 'All';
  const sort = SORT_OPTIONS.some(([value]) => value === params.get('sort')) ? params.get('sort') : 'featured';
  const offersOnly = params.get('offers') === '1';
  const inStockOnly = params.get('stock') === '1';
  const minimum = Math.max(0, Number(params.get('min')) || 0);
  const maximum = params.get('max') ? Math.max(0, Number(params.get('max')) || 0) : Infinity;
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  const deferredQuery = useDeferredValue(query);
  const title = routeBrand ? `${routeBrandDisplay} collection` : offersOnly ? 'Deals worth discovering' : productType !== 'All' ? productType : category !== 'All' ? category === 'Mobile' ? 'Mobile phones' : category : 'Explore all products';
  const categorySeo = CATEGORY_SEO[category];
  const metaTitle = routeBrand
    ? `Shop ${routeBrandDisplay} in Ja-Ela & Kandana | DPK Mobile`
    : categorySeo?.[0]
      ? `${categorySeo[0]} | DPK Mobile`
      : 'Phones, Tech & Accessories in Ja-Ela & Kandana | DPK Mobile';
  const metaDescription = routeBrand
    ? `Shop ${routeBrandDisplay} phones and technology at DPK Mobile in Ja-Ela and Kandana. Browse current products, prices and availability.`
    : categorySeo?.[1] || 'Browse phones, tablets, laptops, smart watches and accessories from DPK Mobile in Ja-Ela and Kandana.';
  const canonical = routeBrand ? location.pathname : category !== 'All' ? categoryPath(category) : '/shop';
  const hasFilterParameters = params.toString().length > 0;
  const breadcrumbName = routeBrandDisplay || categorySeo?.[0] || 'Shop';

  useDocumentMeta(metaTitle, metaDescription, {
    canonical,
    robots: hasFilterParameters ? 'noindex, follow, max-image-preview:large' : undefined,
    structuredData: [breadcrumbSchema([
      { name: 'Home', path: '/' },
      ...(routeBrand ? [{ name: 'Brands', path: '/brands' }] : []),
      { name: breadcrumbName, path: canonical },
    ])],
  });

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const onChange = () => {
      setIsMobile(media.matches);
      setFiltersOpen(false);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const dialog = filterDialogRef.current;
    if (!isMobile || !dialog) return undefined;
    if (!filtersOpen) {
      if (dialog.open) dialog.close();
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [filtersOpen, isMobile]);

  // Prices and brand spellings are calculated once per catalog refresh, not in sorting comparisons.
  const indexedProducts = useMemo(() => products.map((product) => ({
    product,
    brand: canonicalBrand(product.Brand),
    pricing: getPricing(product),
    date: Date.parse(product.Timestamp) || 0,
  })), [products]);

  const categories = useMemo(() => {
    const counts = new Map();
    let total = 0;
    indexedProducts.forEach((item) => {
      if (routeBrand && item.brand !== routeBrand) return;
      total += 1;
      counts.set(item.product.category, (counts.get(item.product.category) || 0) + 1);
    });
    return [['All', total], ...[...counts.entries()].sort(([a], [b]) => a.localeCompare(b))];
  }, [indexedProducts, routeBrand]);

  const results = useMemo(() => {
    const tokens = lower(deferredQuery).split(/\s+/).filter(Boolean);
    const list = indexedProducts.filter(({ product, brand: productBrand, pricing }) => (
      tokens.every((token) => product._searchText.includes(token))
      && (category === 'All' || lower(product.category) === lower(category))
      && (productType === 'All' || lower(product.Product_Type) === lower(productType))
      && (brand === 'All' || productBrand === brand)
      && (!offersOnly || pricing.discounted)
      && (!inStockOnly || (product.Stock_Qty > 0 && !/out[\s_-]*of[\s_-]*stock|sold[\s_-]*out/i.test(product.Status || '')))
      && (minimum === 0 || pricing.current >= minimum)
      && (maximum === Infinity || (pricing.current > 0 && pricing.current <= maximum))
    ));
    if (sort === 'price-low') list.sort((a, b) => (a.pricing.current || Infinity) - (b.pricing.current || Infinity));
    if (sort === 'price-high') list.sort((a, b) => b.pricing.current - a.pricing.current);
    if (sort === 'name') list.sort((a, b) => a.product.Product_Name.localeCompare(b.product.Product_Name));
    if (sort === 'newest') list.sort((a, b) => b.date - a.date);
    if (sort === 'featured') list.sort((a, b) => Number(['yes', 'true', '1', 'featured'].includes(lower(b.product.Featured))) - Number(['yes', 'true', '1', 'featured'].includes(lower(a.product.Featured))));
    return list.map(({ product }) => product);
  }, [indexedProducts, deferredQuery, category, productType, brand, sort, offersOnly, inStockOnly, minimum, maximum]);

  function updateParam(key, value, { replace = false } = {}) {
    if (key === 'category' && !routeBrand) {
      const next = new URLSearchParams(params);
      next.delete('category');
      next.delete('page');
      const target = value === '' || value === 'All' ? '/shop' : categoryPath(value);
      navigate(`${target}${next.size ? `?${next}` : ''}`, { replace });
      return;
    }
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value === '' || value === 'All' || (key === 'sort' && value === 'featured') || (key === 'page' && value === 1)) next.delete(key);
      else next.set(key, String(value));
      if (key !== 'page') next.delete('page');
      return next;
    }, { replace });
  }

  const activeFilters = [
    query && ['q', `Search: ${query}`], !pathCategory && category !== 'All' && ['category', category], productType !== 'All' && ['type', productType],
    !routeBrand && brand !== 'All' && ['brand', getBrand(brand).displayName], offersOnly && ['offers', 'On offer'],
    inStockOnly && ['stock', 'In stock'],
    minimum > 0 && ['min', `From ${formatPrice(minimum)}`],
    maximum !== Infinity && ['max', `Up to ${formatPrice(maximum)}`],
  ].filter(Boolean);

  const filterPanel = (
    <aside id="catalog-filters" className={`catalog-sidebar ${filtersOpen ? 'is-open' : ''}`} aria-label="Product filters">
      <div className="sidebar-heading"><div><span className="catalog-filter-kicker">FIND YOUR NEXT UPGRADE</span><h2 id="catalog-filter-title">Filters</h2></div>{isMobile ? <button className="filter-close" onClick={() => setFiltersOpen(false)} aria-label="Close product filters"><X size={20} /></button> : activeFilters.length > 0 && <button className="clear-filters" onClick={() => setParams({})}>Reset all</button>}</div>
      <fieldset className="filter-group"><legend>Categories</legend><div className="filter-options">{categories.map(([item, count]) => <label className={`filter-option ${lower(category) === lower(item) ? 'is-active' : ''}`} key={item}><input type="radio" name="category" checked={lower(category) === lower(item)} onChange={() => updateParam('category', item)} /><span>{item === 'All' ? 'All categories' : item === 'Mobile' ? 'Mobile phones' : item}</span><small>{count}</small></label>)}</div></fieldset>
      {!routeBrand && <fieldset className="filter-group"><legend>Brand</legend><select aria-label="Filter by brand" value={brand} onChange={(event) => updateParam('brand', event.target.value)}><option value="All">All brands</option>{brandSettings.map((item) => <option key={item.name} value={item.name}>{item.displayName}</option>)}</select></fieldset>}
      <fieldset className="filter-group"><legend>Price range</legend><div className="price-inputs"><label>Min (LKR)<input type="number" min="0" step="1000" inputMode="numeric" placeholder="0" value={params.get('min') || ''} onChange={(event) => updateParam('min', event.target.value, { replace: true })} /></label><span aria-hidden="true">–</span><label>Max (LKR)<input type="number" min="0" step="1000" inputMode="numeric" placeholder="Any" value={params.get('max') || ''} onChange={(event) => updateParam('max', event.target.value, { replace: true })} /></label></div>{minimum > maximum && <p className="price-range-hint" role="status">Set a maximum price above the minimum.</p>}</fieldset>
      <fieldset className="filter-group"><legend>Availability & offers</legend><div className="filter-options"><label className="filter-option"><input type="checkbox" checked={inStockOnly} onChange={(event) => updateParam('stock', event.target.checked ? '1' : '')} /><span>In stock only</span></label><label className="filter-option"><input type="checkbox" checked={offersOnly} onChange={(event) => updateParam('offers', event.target.checked ? '1' : '')} /><span>Show discounted products</span></label></div></fieldset>
      {isMobile ? <div className="filter-drawer-actions"><button className="clear-filters" onClick={() => setParams({})}>Reset all</button><button className="filter-view-results" onClick={() => setFiltersOpen(false)}>Show {results.length} product{results.length === 1 ? '' : 's'}<ChevronRight size={17} /></button></div> : <div className="sidebar-help"><h3>Find your perfect fit.</h3><p>A little advice makes the next upgrade easier.</p><Link to="/about">Talk to our team <ChevronRight size={14} /></Link></div>}
    </aside>
  );

  return (
    <main className="catalog-page retail-catalog">
      <section className="catalog-hero shell">
        <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} />{routeBrand ? <><Link to="/brands">Brands</Link><ChevronRight size={13} /><span aria-current="page">{routeBrandDisplay}</span></> : <span aria-current="page">{categorySeo?.[0] || 'Shop'}</span>}</nav>
        <div className="catalog-brand-heading">{routeBrand && <BrandLogo brand={routeBrand} />}<div><span className="eyebrow">{routeBrand ? 'Your favourite brand. Your next upgrade.' : offersOnly ? 'More tech. More value.' : 'Find something you’ll love'}</span><h1>{title}</h1><p>{routeBrand ? `Discover ${routeBrandDisplay} products, explore the options and find the right one for you.` : 'From your everyday essentials to your next big upgrade. Explore our collection.'}</p></div></div>
      </section>
      <CatalogNotice />
      <section className="catalog-content shell">
        {!routeBrand && visibleBrands.length > 0 && <div className="catalog-brand-picker" role="group" aria-label="Shop by brand"><button className={`catalog-brand-option catalog-brand-option--all ${brand === 'All' ? 'is-selected' : ''}`} aria-pressed={brand === 'All'} onClick={() => updateParam('brand', 'All')}><span>ALL</span><small>All brands</small></button>{visibleBrands.map((item) => <button key={item.name} className={`catalog-brand-option ${brand === item.name ? 'is-selected' : ''}`} aria-label={`Filter ${item.displayName} products`} aria-pressed={brand === item.name} onClick={() => updateParam('brand', brand === item.name ? 'All' : item.name)}><BrandLogo brand={item.name} /><small>{item.displayName}</small></button>)}</div>}
        <div className="catalog-search search-control"><Search size={19} /><input type="search" value={query} onChange={(event) => updateParam('q', event.target.value, { replace: true })} placeholder={routeBrand ? `Search ${routeBrandDisplay} products…` : 'Search products, brands and more…'} aria-label="Search catalog" />{query && <button onClick={() => updateParam('q', '', { replace: true })} aria-label="Clear search"><X size={18} /></button>}</div>
        <div className="catalog-layout">
          <button ref={filterTriggerRef} className="filter-toggle" aria-expanded={filtersOpen} aria-controls="catalog-filters" aria-haspopup="dialog" onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal size={17} />Filter products{activeFilters.length > 0 && <span>{activeFilters.length}</span>}</button>
          {isMobile ? <dialog ref={filterDialogRef} className="catalog-filter-dialog" aria-labelledby="catalog-filter-title" onCancel={(event) => { event.preventDefault(); setFiltersOpen(false); }} onClose={() => { setFiltersOpen(false); if (isMobile) filterTriggerRef.current?.focus({ preventScroll: true }); }} onClick={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}>{filterPanel}</dialog> : filterPanel}
          <div className="catalog-results" aria-busy={query !== deferredQuery}>
            <div className="results-row"><p role="status"><strong>{results.length}</strong> product{results.length === 1 ? '' : 's'}{routeBrand ? ` from ${routeBrandDisplay}` : ' found'}</p><label className="catalog-sort">Sort by<select value={sort} onChange={(event) => updateParam('sort', event.target.value)}>{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
            {activeFilters.length > 0 && <div className="active-filters">{activeFilters.map(([key, label]) => <button className="filter-chip" key={key} onClick={() => updateParam(key, '')} aria-label={`Remove ${label} filter`}>{label}<X size={13} /></button>)}<button className="clear-filters" onClick={() => setParams({})}>Clear all</button></div>}
            {loading && !products.length ? <ProductSkeletons count={12} /> : <ProductGrid products={results} page={page} onPageChange={(nextPage) => updateParam('page', nextPage)} onReset={activeFilters.length ? () => setParams({}) : undefined} />}
          </div>
        </div>
      </section>
    </main>
  );
}
