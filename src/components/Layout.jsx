import { Link, Outlet } from 'react-router-dom';
import { ArrowRight, Headphones, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Store, Truck } from 'lucide-react';
import StoreHeader, { StoreBrand } from './StoreHeader';
import { CONFIG } from '../config';
import PageTransition from './PageTransition';
import MobileDock from './MobileDock';

export default function Layout() {
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <StoreHeader />
    <PageTransition><Outlet /></PageTransition>
    <section className="store-services" aria-label="Shopping with DPK Mobile"><div className="shell"><article><Truck /><div><strong>Islandwide delivery</strong><span>Ask us about delivery to your door</span></div></article><article><ShieldCheck /><div><strong>Warranty support</strong><span>Clear cover for your chosen device</span></div></article><article><Headphones /><div><strong>Friendly expert advice</strong><span>Real people, ready to help</span></div></article><article><Store /><div><strong>Visit us in store</strong><span>Ja-Ela & Kandana</span></div></article></div></section>
    <section className="support-strip"><div className="shell"><div><MessageCircle size={28} /><span><strong>Not sure which one to choose?</strong><small>Tell us what you need. We’ll help you find it.</small></span></div><a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer">Let’s talk on WhatsApp <ArrowRight size={17} /></a></div></section>
    <footer className="footer"><div className="shell footer-top"><div className="footer-lead"><Link to="/" aria-label="DPK Mobile home"><StoreBrand /></Link><p>Your destination for phones, accessories and everyday tech. Browse online or visit our team in store.</p><a className="footer-hotline" href={`tel:${CONFIG.phone}`}><Headphones /><span><small>Got a question? Call us</small><strong>077 385 2437</strong></span></a></div><div><h3>Shop with us</h3><Link to="/brands">Shop by brand</Link><Link to="/shop?category=Mobile">Smartphones</Link><Link to="/shop?category=Tablets">Tablets & iPads</Link><Link to="/shop?category=Laptops">Laptops</Link><Link to="/shop?category=Wearables">Smart watches</Link><Link to="/shop?category=Accessories">Accessories</Link><Link to="/shop?offers=1">Latest deals</Link></div><div><h3>Here to help</h3><Link to="/admin-key.html">Store administration</Link><Link to="/about">About DPK Mobile</Link><Link to="/cart">Shopping cart</Link><a href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer">Delivery enquiries</a><a href={`https://wa.me/${CONFIG.whatsapp}?text=Hello%2C%20I%20have%20a%20warranty%20question.`} target="_blank" rel="noreferrer">Warranty & aftercare</a><a href={`mailto:${CONFIG.email}`}>Contact us</a></div><div className="footer-contact"><h3>Come say hello</h3>{CONFIG.locations.map((location) => <p key={location}><MapPin size={17} />{location}</p>)}<a href={`tel:${CONFIG.phone}`}><Phone size={15} /> 077 385 2437</a><a href={`mailto:${CONFIG.email}`}><Mail size={15} /> {CONFIG.email}</a></div></div><div className="footer-bottom"><div className="shell"><span>© {new Date().getFullYear()} DPK Mobile. All rights reserved.</span><span>Made for everyday connections. <b>Ja-Ela · Kandana</b></span></div></div></footer>
    <a className="whatsapp-float" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer" aria-label="Chat with DPK Mobile on WhatsApp"><MessageCircle size={24} /><span>How can we help?</span></a>
    <MobileDock />
  </div>;
}
