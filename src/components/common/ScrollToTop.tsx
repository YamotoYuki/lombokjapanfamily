import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Reset scroll to the top on every route change (all viewports).
 * Covers window + documentElement + body for mobile Safari quirks.
 * Hash-only changes are ignored so in-page anchors still work.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    const reset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    reset();

    // Second pass after paint — helps when lazy pages remount / mobile address bar.
    const raf = window.requestAnimationFrame(() => {
      reset();
    });
    const timer = window.setTimeout(reset, 0);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [pathname, search]);

  return null;
}
