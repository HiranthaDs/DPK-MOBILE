import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, LockKeyhole, LogOut,
  Monitor, RefreshCw, Settings2, X,
} from 'lucide-react';
import ProductManager from '../components/ProductManager';
import { useCatalog } from '../context/CatalogContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { authenticateAdmin, fetchAdminProducts } from '../lib/adminApi';
import { CONFIG } from '../config';
import '../styles/admin.css';

function AdminLogin({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      await authenticateAdmin(password);
      sessionStorage.setItem('dpk-admin-access-key', password);
      sessionStorage.setItem('dpk-admin-authenticated', 'true');
      onAuthenticated(password);
    } catch (loginError) { setError(loginError.message); }
    finally { setLoading(false); }
  }

  return <main className="admin-login-page"><section className="admin-login-card">
    <div className="admin-login-card__brand"><span><LockKeyhole size={26} /></span><div><strong>DPK MOBILE</strong><small>Product administration</small></div></div>
    <div className="admin-login-card__copy"><span className="admin-kicker">Authorised team access</span><h1>Welcome back.</h1><p>Sign in to add products and keep the storefront catalog up to date.</p></div>
    <form onSubmit={submit}><label><span>Admin password</span><div><LockKeyhole size={17} /><input type={show ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoFocus autoComplete="current-password" /><button type="button" onClick={() => setShow((value) => !value)}>{show ? 'Hide' : 'Show'}</button></div></label>{error && <p className="admin-login-error" role="alert">{error}</p>}<button className="admin-login-submit" disabled={loading || !password}>{loading ? 'Checking access...' : 'Open admin portal'} <ArrowRight size={17} /></button></form>
    <footer><span className={CONFIG.adminApiUrl ? 'is-live' : ''} />{CONFIG.adminApiUrl ? 'Protected by Google Apps Script' : 'Local setup mode - connect Apps Script to publish'}</footer>
  </section></main>;
}

export default function Admin() {
  const { products, loading, error, refreshing, retry, source, applyProductMutation } = useCatalog();
  const [accessKey, setAccessKey] = useState(() => sessionStorage.getItem('dpk-admin-access-key') || '');
  const [authState, setAuthState] = useState(() => sessionStorage.getItem('dpk-admin-authenticated') === 'true' ? 'checking' : 'signed-out');
  const [message, setMessage] = useState('');
  const [managedProducts, setManagedProducts] = useState([]);
  const [managementError, setManagementError] = useState('');
  useDocumentMeta('Product management | DPK Mobile', 'Add and update DPK Mobile products in Google Sheets.', { canonical: '/admin-key.html', robots: 'noindex, nofollow' });

  useEffect(() => {
    if (authState !== 'checking') return undefined;
    let active = true;
    authenticateAdmin(accessKey).then(() => { if (active) setAuthState('signed-in'); }).catch(() => {
      if (!active) return;
      sessionStorage.removeItem('dpk-admin-access-key');
      sessionStorage.removeItem('dpk-admin-authenticated');
      setAccessKey(''); setAuthState('signed-out');
    });
    return () => { active = false; };
  }, [accessKey, authState]);

  useEffect(() => {
    if (authState !== 'signed-in') return undefined;
    let active = true;
    if (!CONFIG.adminApiUrl) { setManagedProducts(products); return undefined; }
    fetchAdminProducts(accessKey).then((items) => {
      if (active) { setManagedProducts(items); setManagementError(''); }
    }).catch((loadError) => {
      if (active) { setManagementError(loadError.message); setManagedProducts(products); }
    });
    return () => { active = false; };
  }, [accessKey, authState]);

  useEffect(() => {
    if (!CONFIG.adminApiUrl && authState === 'signed-in') setManagedProducts(products);
  }, [products, authState]);

  if (authState === 'checking') return <main className="admin-login-page"><div className="admin-auth-check"><RefreshCw className="admin-spinning" /><strong>Securing your workspace...</strong></div></main>;
  if (authState !== 'signed-in') return <AdminLogin onAuthenticated={(password) => { setAccessKey(password); setAuthState('signed-in'); }} />;

  function logout() {
    sessionStorage.removeItem('dpk-admin-access-key');
    sessionStorage.removeItem('dpk-admin-authenticated');
    setAccessKey(''); setAuthState('signed-out');
  }

  function productChanged(product) {
    if (!product) { retry(); return; }
    applyProductMutation(product);
    setManagedProducts((current) => {
      const withoutProduct = current.filter((item) => item.Product_ID !== product.Product_ID);
      if (/archived|draft|hidden|inactive|deleted|disabled/i.test(product.Status)) return withoutProduct;
      return [product, ...withoutProduct];
    });
  }

  const catalogProducts = managedProducts.length ? managedProducts : products;
  return <main className="admin-page">
    <div className="shell admin-simple-shell">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span aria-current="page">Product management</span></nav>
      <header className="admin-heading"><div><span className="admin-kicker"><Settings2 size={14} /> Simple catalog management</span><h1>Product management<span>.</span></h1><p>Add, review and publish products without editing spreadsheet columns or JSON.</p></div><div className="admin-heading__actions"><Link className="admin-button admin-button--secondary" to="/">View storefront <ArrowUpRight size={16} /></Link><button className="admin-button admin-button--quiet" onClick={logout}><LogOut size={15} /> Sign out</button></div></header>
      <div className="admin-workspace-note"><Monitor size={20} /><div><strong>{loading ? 'Loading catalog...' : error ? 'Catalog needs attention' : source === 'cache' ? 'Showing saved catalog' : 'Google Sheets connected'}</strong><p>Product changes are saved through the secured Apps Script endpoint. Use the desktop and mobile preview before saving.</p></div><button onClick={retry} disabled={loading || refreshing}><RefreshCw size={13} className={refreshing ? 'admin-spinning' : ''} />{refreshing ? 'Refreshing...' : 'Refresh'}</button></div>
      {error && <div className="admin-error" role="alert">{error} <button onClick={retry} disabled={refreshing}>Try again</button></div>}
      {managementError && <div className="admin-error" role="alert">{managementError}</div>}
      {message && <div className="admin-success" role="status"><CheckCircle2 size={18} /><span>{message}</span><button className="admin-icon-button" onClick={() => setMessage('')} aria-label="Dismiss notification"><X size={16} /></button></div>}
      <ProductManager products={catalogProducts} accessKey={accessKey} onChanged={productChanged} onMessage={setMessage} />
    </div>
  </main>;
}
