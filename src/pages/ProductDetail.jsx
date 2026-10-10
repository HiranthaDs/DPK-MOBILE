import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, MessageCircle, Package, RefreshCw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import CatalogNotice from '../components/CatalogNotice';
import ProductCard from '../components/ProductCard';
import SmartImage from '../components/SmartImage';
import ExtendedProductDetails from '../components/ExtendedProductDetails';
import { ProductSkeletons } from '../components/ProductGrid';
import { CONFIG, PLACEHOLDER_IMAGE } from '../config';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { canonicalBrand, brandPath } from '../lib/brands';
import { formatPrice, getPricing } from '../lib/catalog';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const variantLabel = (variant) => [variant.ram, variant.rom, variant.color].filter(Boolean).join(' · ') || 'Standard';

export default function ProductDetail() {
  const { id } = useParams();
  const { productMap, products, loading, error, retry } = useCatalog();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const product = productMap.get(id);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const variant = product?.variants?.[selectedVariantIndex] || null;
  const pricing = getPricing(product, variant);
  useDocumentMeta(product ? `${product.Product_Name} | DPK Mobile` : 'Product | DPK Mobile', product?.Description?.slice(0, 155) || 'View product price, variants and availability at DPK Mobile.');

  useEffect(() => {
    const firstAvailable = product?.variants?.findIndex((item) => item.stockQty === null || item.stockQty > 0) ?? -1;
    setSelectedVariantIndex(firstAvailable >= 0 ? firstAvailable : 0);
    setActiveImage(0);
    setAdded(false);
  }, [id, product]);
  useEffect(() => {
    if (!added) return undefined;
    const timeout = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(timeout);
  }, [added]);

  const related = useMemo(() => {
    if (!product) return [];
    return products.filter((item) => item.Product_ID !== product.Product_ID
      && (item.category === product.category || (product.Brand && canonicalBrand(item.Brand) === canonicalBrand(product.Brand)))).slice(0, 4);
  }, [product, products]);

  if (loading && !product) return <main className="detail-page shell"><div className="page-heading"><span className="eyebrow">A closer look</span><p role="status">Loading product details…</p></div><ProductSkeletons count={4} /></main>;
  if (!product) return (
    <main className="not-found dpk-empty-page shell">
      <div className="empty-state-icon"><Package size={34} /></div>
      <span className="eyebrow">{error ? 'Connection interrupted' : 'Product unavailable'}</span>
      <h1>{error ? 'Let’s try that again.' : 'Product not found.'}</h1>
      <p>{error ? 'We couldn’t load this product. Try again to check the latest details.' : 'This item may have been removed from the current collection. There’s more to explore in the shop.'}</p>
      <div className="empty-state-actions">{error && <button type="button" className="button button--dark" onClick={retry}><RefreshCw size={17} /> Try again</button>}<Link className={`button ${error ? 'button--outline' : 'button--dark'}`} to="/shop"><ArrowLeft size={17} /> Back to shop</Link></div>
    </main>
  );

  const images = product.images.length ? [...new Set(product.images)] : [PLACEHOLDER_IMAGE];
  const soldOut = product.Stock_Qty === 0 || variant?.stockQty === 0 || /out[\s_-]*of[\s_-]*stock|sold[\s_-]*out/i.test(product.Status || '');
  const inStock = !soldOut && product.Stock_Qty > 0;
  const whatsappText = encodeURIComponent(`Hi DPK Mobile, I'm interested in ${product.Product_Name}${variant ? ` (${variantLabel(variant)})` : ''}. Price: ${pricing.current ? formatPrice(pricing.current) : 'Please confirm'}. ${window.location.href}`);
  const addToCart = () => {
    if (soldOut || !pricing.current) return;
    addItem(product, variant, pricing.current);
    setAdded(true);
  };
  const buyNow = () => {
    if (soldOut || !pricing.current) return;
    addItem(product, variant, pricing.current);
    navigate('/cart');
  };
  const details = [
    ['Brand', canonicalBrand(product.Brand)], ['Model', product.Model_Number], ['Condition', product.Condition],
    ['RAM', variant?.ram], ['Storage', variant?.rom], ['Colour', variant?.color], ['Warranty', product.Warranty],
    ['SKU', variant?.sku || product.SKU],
  ].filter(([, value]) => value);

  return (
    <main className="detail-page dpk-detail shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link><ChevronRight size={13} /><span aria-current="page">{product.Product_Name}</span></nav>
      <CatalogNotice />
      <section className="product-detail">
        <div className="gallery">
          <div className="gallery-main">
            {pricing.discounted && <span className="gallery-offer">{pricing.percent}% OFF</span>}
            <SmartImage src={images[activeImage] || images[0]} alternatives={images} imageWidth={1000} sizes="(max-width: 800px) 90vw, 600px" alt={`${product.Product_Name}, view ${activeImage + 1}`} priority />
            {images.length > 1 && <div className="gallery-controls"><button type="button" aria-label="Previous product image" onClick={() => setActiveImage((current) => (current - 1 + images.length) % images.length)}><ChevronLeft size={19} /></button><span aria-live="polite">{activeImage + 1} / {images.length}</span><button type="button" aria-label="Next product image" onClick={() => setActiveImage((current) => (current + 1) % images.length)}><ChevronRight size={19} /></button></div>}
          </div>
          {images.length > 1 && <div className="thumbs" role="group" aria-label="Product images">{images.map((image, index) => <button type="button" key={image} aria-label={`Show image ${index + 1} of ${product.Product_Name}`} aria-pressed={index === activeImage} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}><SmartImage src={image} imageWidth={160} sizes="80px" alt="" /></button>)}</div>}
          <p className="gallery-caption">Explore the details. Find your next everyday essential.</p>
        </div>
        <div className="detail-copy">
          <div className="detail-brand-row">{product.Brand && <Link to={brandPath(product.Brand)} className="detail-brand" aria-label={`Shop ${canonicalBrand(product.Brand)}`}><BrandLogo brand={product.Brand} /></Link>}<span className={`detail-stock ${soldOut ? 'out-of-stock' : inStock ? 'stock' : 'stock-unknown'}`}>{inStock ? <Check size={14} /> : <span className="stock-dot" />}{soldOut ? 'Out of stock' : inStock ? 'In stock' : 'Check availability'}</span></div>
          <div className="detail-badges"><span>{product.category}</span>{product.Condition && <span>{product.Condition}</span>}</div>
          <h1>{product.Product_Name}</h1>
          {(product.SKU || product.Model_Number) && <p className="sku">{[product.SKU && `SKU: ${product.SKU}`, product.Model_Number].filter(Boolean).join(' · ')}</p>}
          <div className="detail-pricing-panel"><span className="detail-price-label">{pricing.discounted ? 'Your special price' : 'Our price'}</span><div className="detail-price"><strong>{pricing.current ? formatPrice(pricing.current) : 'Ask for price'}</strong>{pricing.discounted && <del>{formatPrice(pricing.regular)}</del>}</div>{pricing.discounted && <p className="detail-savings"><Check size={14} /> You save {formatPrice(pricing.regular - pricing.current)} ({pricing.percent}%)</p>}</div>
          {product.variants.length > 0 && <div className="variant-picker"><p id="variant-label">Choose your option <span>{product.variants.filter((item) => item.stockQty === null || item.stockQty > 0).length} in stock</span></p><div role="group" aria-labelledby="variant-label">{product.variants.map((item, index) => { const unavailable = item.stockQty === 0; const optionPricing = getPricing(product, item); return <button type="button" key={`${variantLabel(item)}-${index}`} aria-pressed={index === selectedVariantIndex} className={`${index === selectedVariantIndex ? 'active ' : ''}${unavailable ? 'is-unavailable' : ''}`.trim()} disabled={unavailable} onClick={() => { setSelectedVariantIndex(index); setAdded(false); }}><span>{variantLabel(item)}</span><small>{unavailable ? 'Out of stock' : optionPricing.current ? formatPrice(optionPricing.current) : 'Ask for price'}</small>{index === selectedVariantIndex && <Check className="variant-check" size={15} />}</button>; })}</div></div>}
          <div className="purchase-actions"><button type="button" className="button button--dark" onClick={addToCart} disabled={soldOut || !pricing.current}>{added ? <Check size={19} /> : <ShoppingBag size={19} />}{soldOut ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}</button><button type="button" className="button button--buy" onClick={buyNow} disabled={soldOut || !pricing.current}>Buy now <ArrowRight size={18} /></button><a className="button button--outline" href={`https://wa.me/${CONFIG.whatsapp}?text=${whatsappText}`} target="_blank" rel="noreferrer"><MessageCircle size={19} /> Ask on WhatsApp</a></div>
          <span className="sr-only" role="status">{added ? `${product.Product_Name} added to cart.` : ''}</span>
          <p className="purchase-note">Our team confirms availability and final order details before payment.</p>
          <div className="service-points"><p><ShieldCheck /><span><strong>{product.Warranty || 'Warranty information'}</strong>{product.Warranty ? 'Ask us about the cover included.' : 'Confirm the cover with our team.'}</span></p><p><Truck /><span><strong>Delivery & collection</strong>Contact us for options, timing and cost.</span></p></div>
        </div>
      </section>
      <section className="detail-information" aria-labelledby="product-information-title"><div className="detail-information-heading"><Package size={20} /><h2 id="product-information-title">Product information</h2></div><div className="detail-information-body">{product.Description && <div className="description"><span className="eyebrow">A closer look</span><p>{product.Description}</p></div>}{details.length > 0 && <dl className="detail-specs">{details.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}{!product.Description && !details.length && <p>Contact our team for more information about this item.</p>}</div></section>
      <ExtendedProductDetails product={product} />
      {related.length > 0 && <section className="related"><div className="section-heading"><div><span className="eyebrow">More to discover</span><h2>You may also like</h2></div><Link className="text-link" to={`/shop?category=${encodeURIComponent(product.category)}`}>View collection <ArrowRight size={16} /></Link></div><div className="product-grid">{related.map((item) => <ProductCard key={item.Product_ID} product={item} />)}</div></section>}
    </main>
  );
}
