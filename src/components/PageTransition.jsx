import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const { pathname, search, hash } = useLocation();
  const previousPath = useRef(pathname);
  const content = useRef(null);
  const params = new URLSearchParams(search);
  // Collection links can change the page without changing the pathname.
  // Leave search, price inputs and pagination alone so editing stays steady.
  const transitionKey = JSON.stringify([pathname, params.get('category'), params.get('offers'), params.get('sort')]);

  useLayoutEffect(() => {
    if (previousPath.current !== pathname) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      content.current?.focus({ preventScroll: true });
      previousPath.current = pathname;
    }
  }, [pathname]);

  useLayoutEffect(() => {
    const element = content.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || !element?.animate) return undefined;

    // Read the layout before starting any animations. Only reveal sections
    // already in view; long catalogs should not animate hundreds of cards.
    const sections = Array.from(element.querySelectorAll(':scope > main > *'))
      .filter((section) => {
        if (section.matches('dialog, script, style, .sr-only')) return false;
        const bounds = section.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0
          && bounds.bottom > 0 && bounds.top < window.innerHeight;
      })
      .slice(0, 5);
    const compact = window.matchMedia('(max-width: 800px)').matches;
    const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';

    // Keep the shared header still and navigation immediate. The soft fade
    // leads into a staggered rise without retaining an outgoing route.
    const animations = [element.animate([
      { opacity: 0.35 },
      { opacity: 1 },
    ], { duration: 280, easing })];
    sections.forEach((section, index) => {
      animations.push(section.animate([
        { opacity: 0, transform: `translateY(${compact ? 14 : 22}px)` },
        { opacity: 1, transform: 'none' },
      ], {
        duration: compact ? 380 : 440,
        delay: Math.min(index * 45, 135),
        easing,
        // Cover the delay without leaving transforms on sticky content
        // or changing image blending after the animation finishes.
        fill: 'backwards',
      }));
    });
    const cancelAnimations = () => animations.forEach((animation) => animation.cancel());
    const stopForReducedMotion = () => { if (reducedMotion.matches) cancelAnimations(); };
    reducedMotion.addEventListener('change', stopForReducedMotion);
    return () => {
      cancelAnimations();
      reducedMotion.removeEventListener('change', stopForReducedMotion);
    };
  }, [transitionKey]);

  useEffect(() => {
    if (hash) {
      let anchor = hash.slice(1);
      try { anchor = decodeURIComponent(anchor); } catch { /* Keep malformed URL anchors harmless. */ }
      const frame = requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'instant' }));
      return () => cancelAnimationFrame(frame);
    }
  }, [pathname, hash]);

  return <div id="main-content" className="page-transition" key={pathname} ref={content} tabIndex={-1}>{children}</div>;
}
