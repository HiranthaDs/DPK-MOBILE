import { useState } from 'react';
import { ArrowUpRight, BatteryCharging, Box, Camera, ChevronDown, Cpu, Layers3, MonitorSmartphone, Sparkles, Wifi } from 'lucide-react';
import SmartImage from './SmartImage';
import { getExtendedProductContent } from '../lib/productDetails';

const icons = [MonitorSmartphone, Cpu, Camera, BatteryCharging, Wifi, Layers3];

export default function ExtendedProductDetails({ product }) {
  const content = getExtendedProductContent(product);
  const [expanded, setExpanded] = useState(false);
  if (!content) return null;
  const visible = expanded ? content.sections : content.sections.slice(0, 3);

  return <section className={`extended-details extended-details--${content.family}`} aria-labelledby="extended-details-title">
    <header className="extended-details__hero">
      <span className="eyebrow"><Sparkles size={14} /> {content.label}</span>
      <h2 id="extended-details-title">More to know. More to love.</h2>
      <p>{content.intro}</p>
      <div className="extended-details__highlights">{content.highlights.map((item) => <span key={item}><span aria-hidden="true" />{item}</span>)}</div>
    </header>
    <div className="extended-details__grid">{visible.map((section, index) => {
      const Icon = icons[index % icons.length];
      return <article key={`${section.title}-${index}`} className={section.image ? 'has-image' : ''}>
        {section.image && <div className="extended-details__image"><SmartImage src={section.image} alternatives={product.images} imageWidth={800} alt={`${product.Product_Name} — ${section.title}`} /></div>}
        <div><span className="extended-details__icon"><Icon size={19} /></span>{section.eyebrow && <small>{section.eyebrow}</small>}<h3>{section.title}</h3><p>{section.body}</p></div>
      </article>;
    })}</div>
    {content.sections.length > 3 && <button type="button" className="extended-details__more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? 'Show fewer details' : `Show more details (${content.sections.length - 3})`}<ChevronDown size={17} /></button>}
    <div className="extended-details__footer">
      <div><Box size={20} /><span><strong>What’s in the box</strong>{content.inTheBox.length ? content.inTheBox.join(' · ') : 'Box contents can differ by model and region. Confirm the included items with our team.'}</span></div>
      {content.gsmUrl && <a href={content.gsmUrl} target="_blank" rel="noreferrer">Compare technical specifications on GSMArena <ArrowUpRight size={16} /></a>}
    </div>
    <div className="extended-details__faq"><span className="eyebrow">Before you decide</span><h2>Good questions, answered.</h2><details><summary>Is this the right model and region for me?<ChevronDown size={17} /></summary><p>Model numbers, network support and some software features can vary by region. Share your carrier and the features you care about, and our team will help confirm compatibility.</p></details><details><summary>What should I confirm before ordering?<ChevronDown size={17} /></summary><p>Confirm the exact variant, colour, warranty, box contents, stock and delivery timing. The selected option shown above is included when you add the item to your cart.</p></details><details><summary>Are specifications guaranteed?<ChevronDown size={17} /></summary><p>Specifications and availability may change by configuration or market. Use the model number and external specification link as a guide, then verify critical details with our team.</p></details></div>
  </section>;
}
