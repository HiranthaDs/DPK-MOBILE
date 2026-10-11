import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Grid2X2, Headphones, MapPin, Menu, MessageCircle, Phone, Search, ShoppingBag, Tag, X } from 'lucide-react';
import { CONFIG } from '../config';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { formatPrice, getPricing } from '../lib/catalog';
import { categoryPath } from '../lib/seo';
import SmartImage from './SmartImage';
import logo from '../../Icon.png';

export function StoreBrand() {
  return <span className="store-brand"><span className="store-brand-icon"><img src={logo} alt="" width="48" height="48" /></span><span><strong>DPK<span>MOBILE</span></strong><small>Your everyday tech destination</small></span></span>;
}

const navigation = [['All products', '/shop'], ['Smartphones', categoryPath('Mobile')], ['Tablets', categoryPath('Tablets')], ['Laptops', categoryPath('Laptops')], ['Accessories', categoryPath('Accessories')], ['Watches', categoryPath('Wearables')]];

export default function StoreHeader() {
  const { count, total } = useCart();
  const { categories, products, loading } = useCatalog();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const searchRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
    setCategory(params.get('category') || 'All');
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    if (dialogRef.current?.open) dialogRef.current.close();
  }, [location]);

  useEffect(() => {
    const closeSuggestions = (event) => {
      if (!searchRef.current?.contains(event.target)) setSuggestionsOpen(false);
    };
    document.addEventListener('pointerdown', closeSuggestions);
    return () => document.removeEventListener('pointerdown', closeSuggestions);
  }, []);

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    const tokens = query.split(/\s+/).filter(Boolean);
    return products
      .filter((product) => category === 'All' || product.category === category)
      .filter((product) => tokens.every((token) => product._searchText?.includes(token)))
      .map((product) => {
        const name = product.Product_Name.toLowerCase();
        const brand = String(product.Brand || '').toLowerCase();
        const score = name.startsWith(query) ? 0 : name.includes(query) ? 1 : brand.startsWith(query) ? 2 : 3;
        return { product, score };
      })
      .sort((a, b) => a.score - b.score || a.product.Product_Name.localeCompare(b.product.Product_Name))
      .slice(0, 6)
      .map(({ product }) => product);
  }, [category, products, search]);

  useEffect(() => setActiveSuggestion(-1), [search, category]);

  const searchHref = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (category !== 'All') params.set('category', category);
    return `/shop${params.size ? `?${params}` : ''}`;
  };

  const submit = (event) => {
    event.preventDefault();
    setSuggestionsOpen(false);
    navigate(searchHref());
  };

  const chooseSuggestion = (product) => {
    setSuggestionsOpen(false);
    navigate(`/product/${encodeURIComponent(product.Product_ID)}`);
  };

  const handleSearchKeys = (event) => {
    if (event.key === 'Escape') {
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
      return;
    }
    if (!search.trim() || !['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
    const optionCount = suggestions.length + 1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestion((current) => {
        if (event.key === 'ArrowDown') return (current + 1) % optionCount;
        return current <= 0 ? optionCount - 1 : current - 1;
      });
    } else if (event.key === 'Enter' && suggestionsOpen && activeSuggestion >= 0) {
      event.preventDefault();
      if (activeSuggestion < suggestions.length) chooseSuggestion(suggestions[activeSuggestion]);
      else {
        setSuggestionsOpen(false);
        navigate(searchHref());
      }
    }
  };

  return <>
    <div className="utility-bar"><div className="shell utility-inner"><span>Welcome to DPK Mobile. A better connection to your tech.</span><div><Link to="/about"><MapPin size={13} /> Our stores</Link><a href={`tel:${CONFIG.phone}`}><Phone size={13} /> 077 385 2437</a><a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer">Need help?</a></div></div></div>
    <header className="store-header">
      <div className="shell header-main">
        <button className="mobile-menu-trigger" ref={triggerRef} aria-label="Open navigation menu" onClick={() => dialogRef.current?.showModal()}><Menu /></button>
        <Link to="/" aria-label="DPK Mobile home" className="brand-home"><StoreBrand /></Link>
        <form className="header-search" role="search" onSubmit={submit} ref={searchRef}>
          <input type="search" value={search} onFocus={() => setSuggestionsOpen(true)} onKeyDown={handleSearchKeys} onChange={(event) => { setSearch(event.target.value); setSuggestionsOpen(true); }} placeholder="Search for products, brands and more…" aria-label="Search all products" role="combobox" aria-autocomplete="list" aria-expanded={suggestionsOpen && Boolean(search.trim())} aria-controls="header-search-suggestions" aria-activedescendant={activeSuggestion >= 0 ? `header-search-option-${activeSuggestion}` : undefined} />
          <label className="search-category"><span className="sr-only">Search category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All">All categories</option>{categories.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
          <button aria-label="Search"><Search size={21} /></button>
          {suggestionsOpen && search.trim() && <div className="search-suggestions" id="header-search-suggestions" role="listbox" aria-label="Product suggestions">
            <div className="search-suggestions__label">{loading ? 'Updating suggestions…' : suggestions.length ? 'Suggested products' : 'No exact product matches'}</div>
            {suggestions.map((product, index) => {
              const price = getPricing(product).current;
              return <Link id={`header-search-option-${index}`} role="option" aria-selected={activeSuggestion === index} className={activeSuggestion === index ? 'is-active' : ''} key={product.Product_ID} to={`/product/${encodeURIComponent(product.Product_ID)}`} onMouseEnter={() => setActiveSuggestion(index)} onClick={() => setSuggestionsOpen(false)}>
                <span className="search-suggestion__image"><SmartImage src={product.Image_URL1} alternatives={product.images} imageWidth={120} width={54} height={54} sizes="54px" alt="" /></span>
                <span className="search-suggestion__copy"><small>{product.Brand || product.category}</small><strong>{product.Product_Name}</strong><span>{price > 0 ? formatPrice(price) : 'Ask for price'}{product.Stock_Qty === 0 ? ' · Out of stock' : ''}</span></span>
              </Link>;
            })}
            <Link id={`header-search-option-${suggestions.length}`} role="option" aria-selected={activeSuggestion === suggestions.length} className={`search-suggestions__all${activeSuggestion === suggestions.length ? ' is-active' : ''}`} to={searchHref()} onMouseEnter={() => setActiveSuggestion(suggestions.length)} onClick={() => setSuggestionsOpen(false)}><Search size={16} /><span>See all results for <strong>“{search.trim()}”</strong></span></Link>
          </div>}
        </form>
        <a className="header-help" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer"><Headphones size={27} /><span><small>Let’s talk tech</small><strong>Chat with us</strong></span></a>
        <Link to="/cart" className="header-cart" aria-label={`Shopping cart, ${count} items`}><span className="cart-icon"><ShoppingBag size={26} /><b>{count > 99 ? '99+' : count}</b></span><span><small>Your cart</small><strong>{formatPrice(total)}</strong></span></Link>
      </div>
      <div className="navigation-line"><nav className="shell main-navigation" aria-label="Main navigation"><Link to="/shop" className="departments-trigger"><Grid2X2 size={17} /> All departments <ChevronDown size={15} /></Link><div className="navigation-links">{navigation.slice(1).map(([label, path]) => <Link key={label} to={path} aria-current={`${location.pathname}${location.search}` === path ? 'page' : undefined}>{label}</Link>)}<Link to="/brands" aria-current={location.pathname === '/brands' ? 'page' : undefined}>All brands</Link></div><Link className="deals-link" to="/shop?offers=1"><Tag size={16} /> Best deals</Link></nav></div>
      <nav className="mobile-quick-links" aria-label="Quick shopping links"><Link to="/shop?sort=newest">New arrivals</Link><Link to={categoryPath('Mobile')}>Smartphones</Link><Link to={categoryPath('Accessories')}>Accessories</Link><Link to="/shop?offers=1"><Tag size={12} /> Deals</Link></nav>
    </header>
    <dialog className="mobile-navigation" ref={dialogRef} onClose={() => triggerRef.current?.focus()} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
      <div className="mobile-navigation-content"><div className="mobile-navigation-head"><StoreBrand /><button aria-label="Close navigation menu" onClick={() => dialogRef.current?.close()}><X /></button></div><nav aria-label="Mobile navigation">{navigation.map(([label, path]) => <Link key={label} to={path}>{label}<ChevronDown size={15} /></Link>)}<Link to="/shop?offers=1">Best deals <Tag size={16} /></Link><Link to="/brands">Shop by brand <Grid2X2 size={16} /></Link><Link to="/about">Visit our stores <MapPin size={16} /></Link></nav><a className="button button--dark" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Chat on WhatsApp</a></div>
    </dialog>
  </>;
}
