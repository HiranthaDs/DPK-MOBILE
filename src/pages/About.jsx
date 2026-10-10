import { ArrowRight, ChevronRight, HeartHandshake, MapPin, MessageCircle, Phone, ShieldCheck, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CONFIG } from '../config';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import lifestyle from '../../phonebar-lifestyle.png';

export default function About() {
  useDocumentMeta('About DPK Mobile | Ja-Ela & Kandana', 'Meet DPK Mobile: thoughtful technology, clear advice and dependable aftercare from Ja-Ela and Kandana.');
  const stores = [
    { town: 'Ja-Ela', name: 'Realty Plaza', address: CONFIG.locations[0], map: 'DPK Mobile Realty Plaza Ja-Ela' },
    { town: 'Kandana', name: 'Colombo Road', address: CONFIG.locations[1], map: 'DPK Mobile 53 Colombo Road Kandana' },
  ];
  return (
    <main className="about-page dpk-about">
      <nav className="breadcrumbs shell" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight size={13} /><span aria-current="page">About us</span></nav>
      <section className="about-hero shell"><div><span className="eyebrow">A little about DPK Mobile</span><h1>Great technology.<br /><em>Even better connections.</em></h1><p>From your next phone to the little things that make it yours. We’re here to help you find technology that fits your everyday life.</p><div className="about-hero-actions"><Link className="button button--dark" to="/shop">Explore the collection <ArrowRight size={17} /></Link><a className="text-link" href="#our-stores">Visit our stores <MapPin size={16} /></a></div><div className="about-location-note"><MapPin size={17} /><span>Find us in <strong>Ja-Ela & Kandana</strong></span></div></div><div className="about-image-wrap"><img src={lifestyle} alt="Technology for everyday life" /><div className="about-image-caption"><span>YOUR EVERYDAY, UPGRADED.</span><strong>Made for the way you live.</strong></div></div></section>
      <section className="about-values shell" aria-label="The DPK approach"><article><Smartphone size={25} /><div><h2>Find your fit</h2><p>Explore new and pre-owned devices, with options for different needs and budgets.</p></div></article><article><ShieldCheck size={25} /><div><h2>Know your device</h2><p>Ask us about condition, specifications and warranty before making your choice.</p></div></article><article><HeartHandshake size={25} /><div><h2>A real conversation</h2><p>Speak with our team online or in store for recommendations and aftercare.</p></div></article></section>
      <section className="about-story shell"><div><div><span className="eyebrow">The DPK approach</span><h2>The right tech.<br />With the right advice.</h2></div><div><p>Choosing technology should feel exciting. Whether you know exactly what you want or need a little guidance, our team helps you understand the options.</p><p>Browse our collection of phones, accessories and everyday essentials. Compare the details that matter to you, then talk to us about availability, condition and warranty.</p><p>Visit us in Ja-Ela or Kandana, or start a conversation on WhatsApp. Good advice is always a great place to start.</p></div></div></section>
      <section className="store-section shell" id="our-stores"><div className="section-heading"><div><span className="eyebrow">Let’s meet in person</span><h2>Your local connection.</h2></div><p>Two locations. A team ready to help.</p></div><div className="store-grid">{stores.map((store, index) => <article key={store.town}><div className="store-card-top"><span className="store-pin"><MapPin size={23} /></span><span>0{index + 1} / {store.town.toUpperCase()}</span></div><h3>{store.name}</h3><p>{store.address}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.map)}`} target="_blank" rel="noreferrer" aria-label={`Open ${store.town} store in Maps`}>Get directions <ArrowRight size={18} /></a></article>)}</div></section>
      <section className="contact-strip shell"><div><span className="eyebrow">Let’s find your next favourite</span><h2>A little advice goes a long way.</h2><p>Tell us what you’re looking for. We’ll help with the rest.</p></div><div><a className="button button--light" href={`https://wa.me/${CONFIG.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp us</a><a className="button button--ghost" href={`tel:${CONFIG.phone}`}><Phone size={17} /> {CONFIG.phone}</a></div></section>
    </main>
  );
}
