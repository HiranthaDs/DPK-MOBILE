import { useMemo, useState } from 'react';
import { ArrowRight, ChevronRight, LayoutGrid, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useBrands } from '../context/BrandContext';
import { useCatalog } from '../context/CatalogContext';
import { brandPath } from '../lib/brands';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import CatalogNotice from '../components/CatalogNotice';

export default function Brands() {
  const { brands } = useBrands();
  const { loading } = useCatalog();
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  useDocumentMeta('Shop by brand | DPK Mobile', 'Explore phone and accessory brands at DPK Mobile. Find your favourite brand and shop its collection.');
  const visibleBrands = useMemo(() => brands.filter((brand) => brand.visible), [brands]);
  const matches = useMemo(() => visibleBrands.filter((brand) =>
    (!availableOnly || brand.productCount > 0) && `${brand.name} ${brand.displayName}`.toLowerCase().includes(query.trim().toLowerCase())
  ).sort((a, b) => a.displayName.localeCompare(b.displayName)), [visibleBrands, query, availableOnly]);

  return <main className="brands-page">
    <div className="shell">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span aria-current="page">Brands</span></nav>
      <section className="brands-hero">
        <div><span className="eyebrow">GREAT TECH STARTS WITH A GREAT BRAND</span><h1>Your favourites.<br /><span>All in one place.</span></h1><p>From your next phone to the little things that complete it.<br className="desktop-break" /> Find the names you know and a few you’ll love discovering.</p></div>
        <div className="brands-hero-mark" aria-hidden="true"><LayoutGrid strokeWidth={1} /><span>{visibleBrands.length} brands to explore</span></div>
      </section>
    </div>
    <CatalogNotice />
    <section className="shell brand-directory" aria-label="Brand directory">
      <div className="brand-directory-toolbar"><div className="brand-directory-search"><Search size={19} /><input type="search" aria-label="Search brands" placeholder="Find a brand…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button aria-label="Clear brand search" onClick={() => setQuery('')}><X size={17} /></button>}</div><label className="brand-stock-filter"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> With products in the catalog</label></div>
      <div className="brand-directory-count" role="status"><strong>{matches.length}</strong> {matches.length === 1 ? 'brand' : 'brands'}{loading && <span> · Updating product counts…</span>}</div>
      {matches.length ? <div className="brand-directory-grid">{matches.map((brand) => <Link to={brandPath(brand.name)} key={brand.name} className="brand-directory-card" aria-label={`Shop ${brand.displayName}`}><div className="brand-directory-logo"><BrandLogo brand={brand.name} /></div><div><span><strong>{brand.displayName}</strong><small>{loading ? 'Updating collection…' : brand.productCount ? `${brand.productCount} ${brand.productCount === 1 ? 'product' : 'products'}` : 'No products listed yet'}</small></span><ArrowRight size={18} /></div></Link>)}</div> : <div className="empty-state"><Search size={32} /><h2>No brands found</h2><p>Try another name or browse the full directory.</p><button className="button button--dark" onClick={() => { setQuery(''); setAvailableOnly(false); }}>Show all brands</button></div>}
    </section>
  </main>;
}
