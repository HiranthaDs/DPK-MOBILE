import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Grid2X2, Headphones, MapPin, Menu, MessageCircle, Phone, Search, ShoppingBag, Tag, X } from 'lucide-react';
import { CONFIG } from '../config';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { formatPrice } from '../lib/catalog';
import logo from '../../Icon.png';

export function StoreBrand() {
  return <span className="store-brand"><span className="store-brand-icon"><img src={logo} alt="" width="48" height="48" /></span><span><strong>DPK<span>MOBILE</span></strong><small>Your everyday tech destination</small></span></span>;
}

const navigation = [['All products', '/shop'], ['Smartphones', '/shop?category=Mobile'], ['Tablets', '/shop?category=Tablets'], ['Laptops', '/shop?category=Laptops'], ['Accessories', '/shop?category=Accessories'], ['Watches', '/shop?category=Wearables']];

export default function StoreHeader() {
  const { count, total } = useCart();
  const { categories } = useCatalog();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
    setCategory(params.get('category') || 'All');
    if (dialogRef.current?.open) dialogRef.current.close();
  }, [location]);

  const submit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (category !== 'All') params.set('category', category);
    navigate(`/shop${params.size ? `?${params}` : ''}`);
  };

  return <>
    <div className="utility-bar"><div className="shell utility-inner"><span>Welcome to DPK Mobile. A better connection to your tech.</span><div><Link to="/about"><MapPin size={13} /> Our stores</Link><a href={`tel:${CONFIG.phone}`}><Phone size={13} /> 077 385 2437</a><a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer">Need help?</a></div></div></div>
    <header className="store-header">
      <div className="shell header-main">
        <button className="mobile-menu-trigger" ref={triggerRef} aria-label="Open navigation menu" onClick={() => dialogRef.current?.showModal()}><Menu /></button>
        <Link to="/" aria-label="DPK Mobile home" className="brand-home"><StoreBrand /></Link>
        <form className="header-search" role="search" onSubmit={submit}>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for products, brands and more…" aria-label="Search all products" />
          <label className="search-category"><span className="sr-only">Search category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="All">All categories</option>{categories.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
          <button aria-label="Search"><Search size={21} /></button>
        </form>
        <a className="header-help" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer"><Headphones size={27} /><span><small>Let’s talk tech</small><strong>Chat with us</strong></span></a>
        <Link to="/cart" className="header-cart" aria-label={`Shopping cart, ${count} items`}><span className="cart-icon"><ShoppingBag size={26} /><b>{count > 99 ? '99+' : count}</b></span><span><small>Your cart</small><strong>{formatPrice(total)}</strong></span></Link>
      </div>
      <div className="navigation-line"><nav className="shell main-navigation" aria-label="Main navigation"><Link to="/shop" className="departments-trigger"><Grid2X2 size={17} /> All departments <ChevronDown size={15} /></Link><div className="navigation-links">{navigation.slice(1).map(([label, path]) => <Link key={label} to={path} aria-current={`${location.pathname}${location.search}` === path ? 'page' : undefined}>{label}</Link>)}<Link to="/brands" aria-current={location.pathname === '/brands' ? 'page' : undefined}>All brands</Link></div><Link className="deals-link" to="/shop?offers=1"><Tag size={16} /> Best deals</Link></nav></div>
      <nav className="mobile-quick-links" aria-label="Quick shopping links"><Link to="/shop?sort=newest">New arrivals</Link><Link to="/shop?category=Mobile">Smartphones</Link><Link to="/shop?category=Accessories">Accessories</Link><Link to="/shop?offers=1"><Tag size={12} /> Deals</Link></nav>
    </header>
    <dialog className="mobile-navigation" ref={dialogRef} onClose={() => triggerRef.current?.focus()} onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>
      <div className="mobile-navigation-content"><div className="mobile-navigation-head"><StoreBrand /><button aria-label="Close navigation menu" onClick={() => dialogRef.current?.close()}><X /></button></div><nav aria-label="Mobile navigation">{navigation.map(([label, path]) => <Link key={label} to={path}>{label}<ChevronDown size={15} /></Link>)}<Link to="/shop?offers=1">Best deals <Tag size={16} /></Link><Link to="/brands">Shop by brand <Grid2X2 size={16} /></Link><Link to="/about">Visit our stores <MapPin size={16} /></Link></nav><a className="button button--dark" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Chat on WhatsApp</a></div>
    </dialog>
  </>;
}
