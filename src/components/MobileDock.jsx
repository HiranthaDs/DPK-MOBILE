import { Grid2X2, Home, LayoutGrid, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function MobileDock() {
  const { pathname } = useLocation();
  const { count } = useCart();
  if (pathname.startsWith('/admin')) return null;
  const links = [
    { path: '/', label: 'Home', icon: Home, active: pathname === '/' },
    { path: '/shop', label: 'Shop', icon: Grid2X2, active: pathname === '/shop' || pathname.startsWith('/product/') },
    { path: '/brands', label: 'Brands', icon: LayoutGrid, active: pathname.startsWith('/brands') },
    { path: '/cart', label: 'Cart', icon: ShoppingBag, active: pathname === '/cart' },
  ];
  return <nav className="mobile-dock" aria-label="Mobile shortcuts">{links.map(({ path, label, icon: Icon, active }) => <Link key={path} to={path} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}><span><Icon size={20} strokeWidth={active ? 2.2 : 1.7} />{path === '/cart' && count > 0 && <b>{count > 99 ? '99+' : count}</b>}</span>{label}</Link>)}</nav>;
}
