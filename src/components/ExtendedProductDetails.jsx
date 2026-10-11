import { useId, useState } from 'react';
import { ArrowUpRight, Box, ChevronDown, Sparkles } from 'lucide-react';
import { getExtendedProductContent } from '../lib/productDetails';
import SmartImage from './SmartImage';

export default function ExtendedProductDetails({ product }) {
  const content = getExtendedProductContent(product);
  const [showAll, setShowAll] = useState(false);
  const detailsId = useId();
  if (!content) return null;

  const previewCount = 4;
  const hasMore = content.sections.length > previewCount;
  const visibleSections = showAll ? content.sections : content.sections.slice(0, previewCount);

  return <section className={`extended-details extended-details--stream extended-details--${content.family}`} aria-labelledby="extended-details-title">
    <header className="extended-details__hero">
      <div className="extended-details__hero-copy">
        <span className="extended-details__journal">DPK PRODUCT GUIDE · {product.category}</span>
        <span className="eyebrow"><Sparkles size={14} /> {content.label}</span>
        <h2 id="extended-details-title">A closer look at <span>{product.Product_Name}.</span></h2>
        <p>{content.intro}</p>
      </div>
      {content.officialImageUrl && <div className="extended-details__device"><span className="extended-details__glow" /><SmartImage src={content.officialImageUrl} imageWidth={1200} width={1200} height={630} sizes="(max-width: 800px) 100vw, 54vw" alt={`Official ${content.maker || ''} image of ${content.model || product.Product_Name}`.trim()} /></div>}
      <div className="extended-details__highlights">{content.highlights.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}</div>
    </header>

    <div className="extended-details__editorial">
      <div className="extended-details__opening"><span>ALL THE DETAILS</span><h3>Everything<br />worth knowing.</h3><p>Explore every important feature in one continuous guide, from display and performance to cameras, battery, connectivity and more.</p></div>
      <div className="extended-details__chapters" id={detailsId}>{visibleSections.map((section, index) => <article key={`${section.title}-${index}`}>
        <div className="extended-details__chapter-index"><span>{String(index + 1).padStart(2, '0')}</span><i /></div>
        <div className="extended-details__chapter-copy">{section.eyebrow && <small>{section.eyebrow}</small>}<h3>{section.title}</h3><p>{section.body}</p></div>
      </article>)}</div>
      {hasMore && <button
        className={`extended-details__more ${showAll ? 'is-open' : ''}`}
        type="button"
        aria-expanded={showAll}
        aria-controls={detailsId}
        onClick={() => setShowAll((current) => !current)}
      >
        <span><strong>{showAll ? 'Show fewer details' : 'See all details'}</strong><small>{showAll ? 'Return to the essential overview' : `Open ${content.sections.length - previewCount} more specification chapters`}</small></span>
        <ChevronDown size={20} aria-hidden="true" />
      </button>}
      <footer className="extended-details__footer">
        <div><Box size={22} /><span><strong>What’s in the box</strong>{content.inTheBox.length ? content.inTheBox.join(' · ') : 'Box contents can differ by model and region. Confirm the included items with our team.'}</span></div>
        {content.sourceUrl && <a href={content.sourceUrl} target="_blank" rel="noreferrer">View official specifications <ArrowUpRight size={17} /></a>}
      </footer>
    </div>
  </section>;
}
