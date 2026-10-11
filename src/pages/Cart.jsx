import { ArrowRight, Check, ChevronRight, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SmartImage from '../components/SmartImage';
import { CONFIG } from '../config';
import { useCart } from '../context/CartContext';
import { canonicalBrand } from '../lib/brands';
import { formatPrice } from '../lib/catalog';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function Cart() {
  const { items, updateQty, removeItem, total, count } = useCart();
  useDocumentMeta('Your Cart | DPK Mobile', 'Review your selected DPK Mobile products and send your order to our team.', { canonical: '/cart', robots: 'noindex, nofollow' });
  const orderText = encodeURIComponent(`Hi DPK Mobile, I'd like to order:\n\n${items.map((item) => `• ${item.Product_Name}${item.selectedVariant ? ` (${[item.selectedVariant.ram, item.selectedVariant.rom, item.selectedVariant.color].filter(Boolean).join(' / ')})` : ''} × ${item.qty} — ${formatPrice(item.cartPrice * item.qty)}`).join('\n')}\n\nEstimated total: ${formatPrice(total)}\nPlease confirm availability and delivery options.`);
  return (
    <main className="cart-page dpk-cart shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span aria-current="page">Shopping cart</span></nav>
      <header className="page-heading"><div><span className="eyebrow">Good choices, all in one place</span><h1>Shopping cart<span className="cart-heading-count">{count}</span></h1><p>{count ? 'Review your selection, then let our team take care of the details.' : 'Your next favourite starts here.'}</p></div>{count > 0 && <Link className="text-link" to="/shop">Continue shopping <ArrowRight size={16} /></Link>}</header>
      {!items.length ? <section className="empty-cart"><div className="empty-state-icon"><ShoppingBag size={34} /></div><h2>Your cart is empty.</h2><p>Discover phones, accessories and everyday essentials.<br />Add your favourites and come back when you’re ready.</p><Link className="button button--dark" to="/shop">Explore products <ArrowRight size={18} /></Link></section> : (
        <div className="cart-layout">
          <section className="cart-list" aria-label="Your cart items"><div className="cart-list-heading"><span>Product</span><span>Quantity & total</span></div>{items.map((item) => <article className="cart-item" key={item.cartItemId}>
            <Link to={`/product/${encodeURIComponent(item.Product_ID)}`} className="cart-image" tabIndex={-1} aria-hidden="true"><SmartImage src={item.Image_URL1} imageWidth={240} sizes="100px" alt="" /></Link>
            <div className="cart-copy"><span>{canonicalBrand(item.Brand)}</span><Link to={`/product/${encodeURIComponent(item.Product_ID)}`}><h2>{item.Product_Name}</h2></Link>{item.selectedVariant && <p>{[item.selectedVariant.ram, item.selectedVariant.rom, item.selectedVariant.color].filter(Boolean).join(' · ')}</p>}<strong>{formatPrice(item.cartPrice)} <small>each</small></strong></div>
            <div className="cart-item-controls"><div className="qty" role="group" aria-label={`Quantity for ${item.Product_Name}`}><button type="button" onClick={() => updateQty(item.cartItemId, item.qty - 1)} aria-label="Decrease quantity"><Minus size={14} /></button><span aria-live="polite">{item.qty}</span><button type="button" onClick={() => updateQty(item.cartItemId, item.qty + 1)} aria-label="Increase quantity"><Plus size={14} /></button></div><strong className="cart-line-total">{formatPrice(item.cartPrice * item.qty)}</strong></div>
            <button type="button" className="remove" onClick={() => removeItem(item.cartItemId)} aria-label={`Remove ${item.Product_Name}`}><Trash2 size={17} /></button>
          </article>)}</section>
          <aside className="cart-summary"><span className="eyebrow">Almost yours</span><h2>Order summary</h2><div><span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span><span>{formatPrice(total)}</span></div><div><span>Delivery</span><span>Confirmed by our team</span></div><div className="cart-summary-total"><span>Estimated total</span><strong>{formatPrice(total)}</strong></div><a className="button button--dark" href={`https://wa.me/${CONFIG.whatsapp}?text=${orderText}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Send order on WhatsApp <ArrowRight size={16} /></a><p className="cart-checkout-note">This sends your selection to our team. Availability, delivery and final payment details are confirmed before you pay.</p><div className="cart-next-step"><Check size={17} /><span>Review your order with a real person.</span></div></aside>
        </div>
      )}
    </main>
  );
}
