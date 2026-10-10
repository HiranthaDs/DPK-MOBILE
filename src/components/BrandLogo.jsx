import { useState } from 'react';
import { useBrand } from '../context/BrandContext';
import { defaultBrandLogo } from '../lib/brandAssets';

export default function BrandLogo({ brand, className = '', logoUrl, displayName }) {
  const configured = useBrand(brand);
  const name = displayName || configured.displayName;
  const preferred = logoUrl === undefined ? configured.logoUrl : logoUrl || defaultBrandLogo(brand);
  const [failedSource, setFailedSource] = useState('');
  const source = preferred && preferred !== failedSource ? preferred : '';
  return (
    <span className={`brand-logo brand-logo--${configured.slug} ${source ? 'brand-logo--image' : ''} ${className}`} role="img" aria-label={name}>
      {source ? (
        <img className="brand-logo__image" src={source} alt="" loading="lazy" decoding="async"
          onError={() => setFailedSource(source)} />
      ) : configured.name === 'Apple' ? (
        <svg className="brand-logo__symbol" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M17.05 12.04c.03 3.17 2.78 4.23 2.81 4.25-.02.08-.44 1.51-1.45 2.99-.87 1.28-1.78 2.56-3.2 2.59-1.39.03-1.84-.84-3.43-.84-1.59 0-2.09.82-3.4.87-1.37.05-2.41-1.39-3.29-2.67-1.8-2.62-3.18-7.4-1.33-10.62a5.1 5.1 0 0 1 4.32-2.61c1.35-.03 2.63.93 3.46.93.83 0 2.39-1.15 4.03-.98.69.03 2.62.28 3.87 2.12-.1.07-2.4 1.4-2.37 3.97ZM14.45 4.2c.73-.89 1.22-2.13 1.09-3.36-1.05.04-2.32.7-3.08 1.59-.68.79-1.27 2.06-1.11 3.27 1.17.09 2.37-.6 3.1-1.5Z" />
        </svg>
      ) : (
        <span className="brand-logo__wordmark" aria-hidden="true">{name}</span>
      )}
    </span>
  );
}
