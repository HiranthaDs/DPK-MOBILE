import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, ChevronLeft, ChevronRight, Grid2X2, Headphones, Laptop, LayoutGrid, Monitor, ShieldCheck, Smartphone, Sparkles, Tablet, Tag, Watch, Zap } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useBrands } from '../context/BrandContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { formatPrice, getPricing, lower } from '../lib/catalog';
import { brandPath, canonicalBrand } from '../lib/brands';
import BrandLogo from '../components/BrandLogo';
import SmartImage from '../components/SmartImage';
import CatalogNotice from '../components/CatalogNotice';
import ProductCard from '../components/ProductCard';
import { ProductSkeletons } from '../components/ProductGrid';

const departments = [
  { label: 'Smartphones', category: 'Mobile', icon: Smartphone },
  { label: 'Tablets & iPads', category: 'Tablets', icon: Tablet },
  { label: 'Laptops & computers', category: 'Laptops', icon: Laptop },
  { label: 'Smart watches', category: 'Wearables', icon: Watch },
  { label: 'Mobile accessories', category: 'Accessories', icon: Zap },
  { label: 'Earbuds & headphones', query: 'buds', icon: Headphones },
  { label: 'Cameras & more', query: 'camera', icon: Camera },
];
const categoryPath = (category) => `/shop?category=${encodeURIComponent(category)}`;
const slides = [
  { brand: 'Apple', kicker: 'YOUR NEXT UPGRADE STARTS HERE', title: <>Big on possibilities.<br /><em>Made for you.</em></>, description: 'Discover your next iPhone. The models you love, with advice you can trust.', label: 'Explore Apple', path: brandPath('Apple'), category: 'Mobile' },
  { brand: 'Samsung', kicker: 'A WORLD OF POSSIBILITIES', title: <>Find your Galaxy.<br /><em>Make it yours.</em></>, description: 'Everyday essentials to flagship favourites. Find your perfect Samsung.', label: 'Explore Samsung', path: brandPath('Samsung'), category: 'Mobile' },
  { brand: '', kicker: 'SMALL UPGRADES. BIG DIFFERENCE.', title: <>Complete your setup.<br /><em>Your way.</em></>, description: 'Discover audio, power and accessories that make every day a little better.', label: 'Shop accessories', path: categoryPath('Accessories'), category: 'Accessories' },
];

function BrandShelf() {
  const { brands } = useBrands();
  const sortedBrands = useMemo(() => {
    const priority = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'OnePlus', 'HONOR', 'JBL', 'Anker'];
    return brands.filter((brand) => brand.visible).sort((a, b) => {
      const rank = (name) => priority.includes(name) ? priority.indexOf(name) : 99;
      return Number(b.productCount > 0) - Number(a.productCount > 0) || rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
    });
  }, [brands]);
  if (!sortedBrands.length) return null;
  return <section className="brand-section shell" id="brands"><div className="section-heading"><div><span className="section-kicker">THE NAMES YOU LOVE</span><h2>Shop by brand<span>.</span></h2><p>Find your favourite. Discover something new.</p></div><Link className="text-link" to="/brands">All brands <ArrowRight size={16} /></Link></div><div className="brand-grid">{sortedBrands.slice(0, 8).map((brand) => <Link key={brand.name} to={brandPath(brand.name)} className="brand-tile" aria-label={`Shop ${brand.name}`}><BrandLogo brand={brand.name} /><span>{brand.productCount ? `${brand.productCount} products` : 'Explore brand'} <ChevronRight size={12} /></span></Link>)}</div></section>;
}

function ProductSection({ title, subtitle, products, href, children }) {
  const track = useRef(null);
  if (!products.length) return null;
  const scroll = (direction) => track.current?.scrollBy({ left: direction * track.current.clientWidth * .8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  return <section className="product-section shell"><div className="section-heading"><div><h2>{title}<span>.</span></h2>{subtitle && <p>{subtitle}</p>}</div><div className="section-actions">{children}<Link className="text-link" to={href}>View all <ArrowRight size={16} /></Link><div className="rail-controls"><button aria-label={`Previous ${title} products`} onClick={() => scroll(-1)}><ChevronLeft size={18} /></button><button aria-label={`Next ${title} products`} onClick={() => scroll(1)}><ChevronRight size={18} /></button></div></div></div><div className="product-rail home-product-rail" ref={track}>{products.map((product) => <ProductCard key={product.Product_ID} product={product} />)}</div></section>;
}

export default function Home() {
  const { products, loading } = useCatalog();
  const [slideIndex, setSlideIndex] = useState(0);
  const [tab, setTab] = useState('featured');
  useDocumentMeta('DPK Mobile | Phones, Accessories & Everyday Tech', 'Shop smartphones, tablets, laptops, smart watches and accessories. Discover your favourite brands at DPK Mobile, Ja-Ela and Kandana.');
  const selection = useMemo(() => {
    const newest = [...products].sort((a, b) => (Date.parse(b.Timestamp) || 0) - (Date.parse(a.Timestamp) || 0));
    const featured = products.filter((product) => ['yes', 'true', '1', 'featured'].includes(lower(product.Featured)));
    return { featured: (featured.length ? featured : products).slice(0, 10), newest: newest.slice(0, 10), offers: products.filter((product) => getPricing(product).discounted).sort((a, b) => getPricing(b).percent - getPricing(a).percent).slice(0, 10), accessories: products.filter((product) => product.category === 'Accessories').slice(0, 10) };
  }, [products]);
  const slide = slides[slideIndex];
  const heroProducts = products.filter((product) => product.category === slide.category && (!slide.brand || canonicalBrand(product.Brand) === slide.brand)).slice(0, 3);
  const heroProduct = heroProducts[0];
  const heroPrice = heroProduct && getPricing(heroProduct).current;
  const watch = products.find((product) => product.category === 'Wearables' && product.Image_URL1);
  const tablet = products.find((product) => product.category === 'Tablets' && product.Image_URL1);
  const categoryItems = departments.filter((item) => item.category).map((item) => ({ ...item, product: products.find((product) => product.category === item.category && product.Image_URL1), count: products.filter((product) => product.category === item.category).length }));

  return <main className="home-page">
    <div className="home-stage"><div className="shell home-stage-grid">
      <aside className="department-menu" aria-label="Shop departments"><div className="department-heading"><Grid2X2 size={17} /><strong>Shop departments</strong></div><Link className="department-special" to="/shop?offers=1"><Tag size={17} /> Best deals <span>SALE</span></Link><Link className="department-special" to="/shop?sort=newest"><Sparkles size={17} /> New arrivals <ChevronRight size={14} /></Link><a href="#brands"><LayoutGrid size={17} /> All brands <ChevronRight size={14} /></a>{departments.map(({ label, category, query, icon: Icon }) => <Link key={label} to={category ? categoryPath(category) : `/shop?q=${query}`}><Icon size={17} /> {label}<ChevronRight size={14} /></Link>)}<Link className="department-all" to="/shop">Explore all products <ArrowRight size={15} /></Link></aside>
      <div className="home-stage-center">
        <section className={`feature-banner feature-banner--${slideIndex}`} aria-label="Featured collections" aria-roledescription="carousel">
          <div className="feature-copy" key={`copy-${slideIndex}`}><span className="feature-kicker"><i />{slide.kicker}</span><h1>{slide.title}</h1><p>{slide.description}</p><Link className="button button--dark" to={slide.path}>{slide.label} <ArrowRight size={17} /></Link><div className="feature-assurance"><ShieldCheck size={15} /> Clear advice. Dependable aftercare.</div></div>
          <div className="feature-art" key={`art-${slideIndex}`}><span className="feature-ring" /><div className="feature-device">{heroProduct ? <SmartImage key={heroProduct.Product_ID} src={heroProduct.Image_URL1} alternatives={heroProduct.images} imageWidth={600} width={600} height={600} priority alt="" /> : <Smartphone size={150} strokeWidth={.7} />}</div>{heroProduct && <Link className="feature-product-tag" to={`/product/${encodeURIComponent(heroProduct.Product_ID)}`}><span>{heroProduct.Product_Name}</span>{heroPrice > 0 && <strong>From {formatPrice(heroPrice)}</strong>}<ArrowRight size={17} /></Link>}</div>
          <div className="feature-controls"><div className="feature-dots">{slides.map((item, index) => <button key={item.kicker} className={index === slideIndex ? 'active' : ''} aria-label={`Show ${item.label} collection`} aria-pressed={index === slideIndex} onClick={() => setSlideIndex(index)} />)}</div><span>{String(slideIndex + 1).padStart(2, '0')} <i>/ 03</i></span><button aria-label="Previous collection" onClick={() => setSlideIndex((slideIndex + slides.length - 1) % slides.length)}><ChevronLeft size={17} /></button><button aria-label="Next collection" onClick={() => setSlideIndex((slideIndex + 1) % slides.length)}><ChevronRight size={17} /></button></div>
        </section>
        <div className="quick-categories">{categoryItems.map(({ label, category, icon: Icon, product }) => <Link to={categoryPath(category)} key={category}><div>{product ? <SmartImage src={product.Image_URL1} imageWidth={160} width={100} height={100} alt="" /> : <Icon size={38} strokeWidth={1.2} />}</div><span>{label.replace(' & computers', '').replace(' & iPads', '').replace('Mobile accessories', 'Accessories')}</span></Link>)}</div>
      </div>
      <aside className="side-promos" aria-label="More to explore"><Link className="side-promo side-promo--watch" to={categoryPath('Wearables')}><span>STAY CONNECTED</span><h2>A smarter<br />every day.</h2><b>Shop watches <ArrowRight size={15} /></b>{watch ? <SmartImage src={watch.Image_URL1} imageWidth={320} width={240} height={240} alt="Smart watches" /> : <Watch size={90} />}</Link><Link className="side-promo side-promo--tablet" to={categoryPath('Tablets')}><span>WORK. PLAY. CREATE.</span><h2>A little more<br />possibility.</h2><b>Explore tablets <ArrowRight size={15} /></b>{tablet ? <SmartImage src={tablet.Image_URL1} imageWidth={320} width={240} height={240} alt="Tablets and iPads" /> : <Tablet size={90} />}</Link></aside>
    </div></div>
    <CatalogNotice />
    <BrandShelf />
    {loading && !products.length ? <section className="product-section shell"><div className="section-heading"><h2>Finding your next favourite…</h2></div><ProductSkeletons count={5} /></section> : <>
      <ProductSection title="Discover your next favourite" subtitle="Great tech. Carefully selected for you." products={selection[tab]} href={tab === 'offers' ? '/shop?offers=1' : `/shop?sort=${tab}`}><div className="product-tabs" role="group" aria-label="Product collections">{[['featured', 'Featured'], ['newest', 'New arrivals'], ['offers', 'Deals']].map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div></ProductSection>
      <section className="collection-banners shell"><Link to={brandPath('Apple')} className="collection-banner collection-banner--apple"><div><BrandLogo brand="Apple" /><h2>Everything you love.<br />One great ecosystem.</h2><span>Discover Apple <ArrowRight size={17} /></span></div><SmartImage src={products.find((product) => canonicalBrand(product.Brand) === 'Apple' && product.category === 'Mobile')?.Image_URL1} imageWidth={400} width={400} height={400} alt="Explore Apple devices" /></Link><Link to={categoryPath('Accessories')} className="collection-banner collection-banner--accessories"><div><span className="eyebrow">THE FINISHING TOUCH</span><h2>Small essentials.<br />Everyday difference.</h2><span>Shop accessories <ArrowRight size={17} /></span></div><SmartImage src={selection.accessories[0]?.Image_URL1} imageWidth={400} width={400} height={400} alt="Explore accessories" /></Link></section>
      <ProductSection title="Deals worth discovering" subtitle="A little less to spend. A lot more to love." products={selection.offers} href="/shop?offers=1" />
      <ProductSection title="Complete your setup" subtitle="Power, protection and sound. Find the right finishing touch." products={selection.accessories} href={categoryPath('Accessories')} />
    </>}
    <section className="store-invitation shell"><div className="store-invitation-icon"><Monitor size={36} /><Smartphone size={24} /></div><div><span className="eyebrow">ONLINE CONVENIENCE. IN-STORE CARE.</span><h2>Good tech. Real people.</h2><p>Come try it, ask a question, and find what feels right. Visit DPK Mobile in Ja-Ela or Kandana.</p></div><Link className="button button--outline" to="/about">Find our stores <ArrowRight size={17} /></Link></section>
  </main>;
}
