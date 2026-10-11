import { useMemo, useState } from 'react';
import { getImageSources } from '../lib/images';

const NO_ALTERNATIVES = [];

function ImageWithFallback({ candidates, className, onLoad, onError, ...props }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const candidate = candidates[index];

  return (
    <img
      {...props}
      src={candidate.src}
      srcSet={candidate.srcSet}
      className={`smart-image ${loaded ? 'is-loaded' : 'is-loading'} ${className}`.trim()}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        if (index < candidates.length - 1) {
          setLoaded(false);
          setIndex(index + 1);
        } else {
          setLoaded(true);
        }
        onError?.(event);
      }}
    />
  );
}

/** An intrinsic-size image with native lazy loading and bounded fallback requests. */
export default function SmartImage({
  src,
  alternatives = NO_ALTERNATIVES,
  imageWidth = 600,
  width = imageWidth,
  height = imageWidth,
  alt = '',
  sizes = '(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 240px',
  priority = false,
  className = '',
  ...props
}) {
  const candidates = useMemo(() => getImageSources(src, alternatives, imageWidth), [src, alternatives, imageWidth]);
  // A changed source starts with fresh fallback state immediately, including galleries.
  const sourceKey = candidates.map((candidate) => candidate.src).join('|');

  return (
    <ImageWithFallback
      key={sourceKey}
      {...props}
      candidates={candidates}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : 'auto'}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
