import { ArrowRight, ChevronRight, Headphones, MapPin, MessageCircle, Phone, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { breadcrumbSchema, storeSchema } from '../lib/seo';

const locationCopy = {
  'ja-ela': {
    lead: 'Visit DPK Mobile at Realty Plaza when you need a phone shop in Ja-Ela with smartphones, accessories and a real team ready to help you compare your options.',
    area: 'Our Ja-Ela branch serves customers visiting from Ja-Ela, Ekala, Kapuwatta, Seeduwa and nearby areas of the Gampaha District.',
  },
  kandana: {
    lead: 'DPK Mobile on Colombo Road is a local phone shop in Kandana for smartphones, accessories and straightforward help choosing technology for everyday life.',
    area: 'Our Kandana branch is convenient for customers visiting from Kandana, Nagoda, Ragama, Welisara and nearby areas of the Gampaha District.',
  },
};

export default function StoreLocation({ storeSlug }) {
  const store = CONFIG.stores.find((item) => item.slug === storeSlug);
  const copy = locationCopy[storeSlug];
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapQuery)}`;
  const title = `Phone Shop in ${store.town} | DPK Mobile ${store.town}`;
  const description = `Visit DPK Mobile ${store.town} at ${store.address}. Shop phones and accessories, compare options and speak with our local team.`;
  useDocumentMeta(title, description, {
    canonical: `/stores/${store.slug}`,
    structuredData: [
      storeSchema(store),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Our stores', path: '/about' },
        { name: `DPK Mobile ${store.town}`, path: `/stores/${store.slug}` },
      ]),
    ],
  });

  const questions = [
    [`Where is DPK Mobile ${store.town}?`, `You can find DPK Mobile ${store.town} at ${store.address}. Use the map on this page for directions.`],
    [`What can I buy at the ${store.town} phone shop?`, 'Browse smartphones, tablets, laptops, smart watches, audio products, chargers, power banks, cases and other mobile accessories. Current availability can change, so contact our team before travelling for a specific item.'],
    ['Can I check a phone price or availability before visiting?', `Yes. Call ${CONFIG.phone} or message DPK Mobile on WhatsApp with the product name. Our team can confirm the latest listed price and availability.`],
    ['Can I ask about delivery and warranty?', 'Yes. Ask our team about available delivery options, timing, cost and the warranty information for the exact product you are considering.'],
  ];

  return <main className="store-location-page">
    <nav className="breadcrumbs shell" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><Link to="/about">Our stores</Link><ChevronRight size={13} /><span aria-current="page">{store.town}</span></nav>
    <section className="store-location-hero shell">
      <div className="store-location-hero__copy"><span className="eyebrow">DPK MOBILE · {store.town.toUpperCase()}</span><h1>Phone shop in<br /><em>{store.town}.</em></h1><p>{copy.lead}</p><div className="store-location-actions"><a className="button button--dark" href={directions} target="_blank" rel="noreferrer"><MapPin size={18} /> Get directions</a><a className="button button--outline" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Ask on WhatsApp</a></div></div>
      <div className="store-location-card"><span><MapPin size={25} /></span><small>VISIT OUR {store.town.toUpperCase()} STORE</small><h2>{store.branch}</h2><address>{store.address}</address><a href={`tel:${CONFIG.phone}`}><Phone size={17} /> {CONFIG.phone}</a></div>
    </section>
    <section className="store-location-map shell" aria-label={`${store.name} map`}><iframe src={store.embed} width="600" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" title={`${store.name} location map`} /><div><span className="eyebrow">YOUR LOCAL TECH DESTINATION</span><h2>Easy to find.<br />Ready to help.</h2><p>{copy.area}</p><p>Browse online before you visit, then contact us to check the latest stock for the device or accessory you want.</p><Link className="text-link" to="/phones">Browse mobile phones <ArrowRight size={17} /></Link></div></section>
    <section className="store-location-services shell" aria-labelledby="store-services-title"><div className="section-heading"><div><span className="eyebrow">HOW WE CAN HELP</span><h2 id="store-services-title">More than a phone shop.</h2></div></div><div><article><Smartphone size={25} /><h3>Phones and everyday tech</h3><p>Explore phones, tablets, wearables, audio products and accessories from the brands in our live catalog.</p></article><article><Headphones size={25} /><h3>Friendly product guidance</h3><p>Tell us what matters to you and ask questions about specifications, condition, price and availability.</p></article><article><ShieldCheck size={25} /><h3>Warranty information</h3><p>Ask about the warranty and aftercare information that applies to the exact device you choose.</p></article><article><Truck size={25} /><h3>Delivery and collection</h3><p>Contact our team to discuss available delivery or store collection options before confirming your order.</p></article></div></section>
    <section className="store-location-faq shell" aria-labelledby="store-faq-title"><span className="eyebrow">QUICK ANSWERS</span><h2 id="store-faq-title">Before you visit DPK Mobile {store.town}.</h2><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section className="contact-strip shell"><div><span className="eyebrow">CHECK BEFORE YOU TRAVEL</span><h2>Looking for a specific phone?</h2><p>Send us the model name and we’ll help with current availability.</p></div><div><a className="button button--light" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp us</a><a className="button button--ghost" href={`tel:${CONFIG.phone}`}><Phone size={17} /> Call {CONFIG.phone}</a></div></section>
  </main>;
}
