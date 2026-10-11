import { PLACEHOLDER_IMAGE } from '../config';

function driveFileId(source) {
  try {
    const url = new URL(source);
    if (url.hostname !== 'drive.google.com' && url.hostname !== 'docs.google.com') return null;
    const id = url.searchParams.get('id') || url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
    return id && /^[\w-]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function imageSource(value) {
  const source = String(value || '').trim();
  if (!source || /^(?:javascript|vbscript|file):/i.test(source)) return '';
  if (/^data:/i.test(source) && !/^data:image\//i.test(source)) return '';
  return source;
}

// Keep stable URLs so browser caching can share images across page visits.
// Drive images are resized by their own host; other image hosts are untouched.
export function getImageSources(source, alternatives = [], requestedWidth = 600) {
  const width = Math.max(80, Math.min(1600, Math.round(Number(requestedWidth) || 600)));
  const retinaWidth = Math.min(1000, Math.round(width * 1.5));
  const seen = new Set();
  const candidates = [];

  for (const value of [source, ...(Array.isArray(alternatives) ? alternatives.slice(0, 8) : [])]) {
    const original = imageSource(value);
    if (!original || original === PLACEHOLDER_IMAGE) continue;
    const id = driveFileId(original);
    const src = id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${width}` : original;
    if (seen.has(src)) continue;
    seen.add(src);
    candidates.push({
      src,
      srcSet: id && retinaWidth > width
        ? `${src} ${width}w, https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${retinaWidth} ${retinaWidth}w`
        : undefined,
    });
  }

  // This is always the final candidate; failure cannot restart the request loop.
  candidates.push({ src: PLACEHOLDER_IMAGE });
  return candidates;
}
