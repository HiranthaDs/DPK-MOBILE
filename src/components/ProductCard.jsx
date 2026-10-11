import { memo, useState } from 'react';
import { Check, ShoppingBag, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatPrice, getPaymentAmounts, getPricing } from '../lib/catalog';
import { canonicalBrand } from '../lib/brands';
import { useCart } from '../context/CartContext';
import SmartImage from './SmartImage';
import '../styles/catalog.css';

function ProductCard({ product }) {
  const [loaded, setLoaded] = useState(false);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const soldOut = product.Stock_Qty === 0 || /out[\s_-]*of[\s_-]*stock|sold[\s_-]*out/i.test(product.Status || '');
  const inStock = !soldOut && product.Stock_Qty > 0;
  const availableVariants = product.variants?.filter((item) => item.stockQty === null || item.stockQty > 0) || [];
  const selectedVariant = availableVariants.length
    ? availableVariants.reduce((best, item) => getPricing(product, item).current < getPricing(product, best).current ? item : best)
    : null;
  const selectedPricing = selectedVariant ? getPricing(product, selectedVariant) : getPricing(product);
  const pricing = { ...selectedPricing, from: availableVariants.length > 1 };
  const paymentAmounts = getPaymentAmounts(pricing.current);
  const canBuy = !soldOut && (!product.variants?.length || Boolean(selectedVariant)) && pricing.current > 0;
  const add = () => {
    if (!canBuy) return;
    addItem(product, selectedVariant, pricing.current);
    setAdded(true);
  };
  const buyNow = () => {
    if (!canBuy) return;
    addItem(product, selectedVariant, pricing.current);
    navigate('/cart');
  };
  return (
    <article className={`product-card retail-product-card${soldOut ? ' is-sold-out' : ''}`}>
      <Link to={`/product/${encodeURIComponent(product.Product_ID)}`} className="product-card-media-link" aria-label={`View ${product.Product_Name}`}>
        <div className={`product-media ${loaded ? 'is-loaded' : ''}`}>
          {pricing.discounted && <span className="sale-badge">{pricing.percent > 0 ? `Save ${pricing.percent}%` : 'On offer'}</span>}
          <SmartImage
            src={product.Image_URL1}
            alternatives={product.images}
            imageWidth={600}
            alt={product.Product_Name}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </Link>
      <div className="product-info">
          <div className="product-meta"><span>{canonicalBrand(product.Brand) || product.category}</span>{product.Condition && <span className="product-condition">{product.Condition}</span>}</div>
          <h3>{product.Product_Name}</h3>
          <div className="price-line">
            {pricing.from && <span className="product-price-prefix">From</span>}
            <strong>{pricing.current ? formatPrice(pricing.current) : 'Ask for price'}</strong>
            {pricing.discounted && <del>{formatPrice(pricing.regular)}</del>}
          </div>
          <div className="koko-payment">
            <img src="/assets/Banks/KOKO.png" width="43" height="20" loading="lazy" alt="Koko" />
            {paymentAmounts
              ? <span className="koko-payment__amount">3 × {formatPrice(paymentAmounts.kokoInstallment)}<span className="sr-only"> per month</span></span>
              : <span className="koko-payment__amount">Ask about 3 payments</span>}
          </div>
          <p className={`product-stock ${soldOut ? 'out-of-stock' : inStock ? 'in-stock' : 'stock-unknown'}`}><span aria-hidden="true" />{soldOut ? 'Out of stock' : inStock ? 'In stock' : 'Check availability'}</p>
          <div className="product-card-actions"><button type="button" className="product-card-add" aria-label={`Add ${product.Product_Name} to cart`} disabled={!canBuy} onClick={add}>{added ? <Check size={14} /> : <ShoppingBag size={14} />}<span className="action-label-long">{soldOut ? 'Out of stock' : added ? 'Added' : 'Add to cart'}</span><span className="action-label-short">{soldOut ? 'Sold out' : added ? 'Added' : 'Add'}</span></button><button type="button" className="product-card-buy" aria-label={`Buy ${product.Product_Name} now`} disabled={!canBuy} onClick={buyNow}><Zap size={14} /><span className="action-label-long">Buy now</span><span className="action-label-short">Buy</span></button></div>
          {product.variants?.length > 0 && <Link className="product-card-options" to={`/product/${encodeURIComponent(product.Product_ID)}`}>Choose options</Link>}
          <span className="sr-only" role="status">{added ? `${product.Product_Name} added to cart.` : ''}</span>
      </div>
    </article>
  );
}

export default memo(ProductCard);
