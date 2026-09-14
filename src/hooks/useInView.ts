import { useEffect, useRef, useState } from 'react';

// Safety-net window for the "Observer never reports anything at all" case
// below — not a "reveal regardless of scroll position" timer. See the
// comment at its use site for why this doesn't fight the normal
// scroll-triggered reveal.
const NO_CALLBACK_FALLBACK_MS = 1500;

export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver support at all (very old browser, or the API
    // removed/blocked in this environment): there's no way to reveal on
    // scroll, so show the content immediately rather than leave it hidden.
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    // The spec guarantees the observer delivers an initial entry shortly
    // after observe() is called, even when the target isn't intersecting
    // yet — that's the normal "still off-screen, wait for scroll" case and
    // must keep working exactly as before. A target that never receives
    // *any* callback (not even that initial false one) means the observer
    // itself isn't functioning in this environment, which is a different,
    // safe-to-reveal situation. Tracking whether we've seen a callback at
    // all — rather than a flat "reveal after N seconds" — is what lets this
    // fallback fire only for that broken case without touching the timing
    // of legitimately-still-off-screen elements.
    let sawCallback = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        sawCallback = true;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px', ...options },
    );

    observer.observe(node);
    const noCallbackFallback = window.setTimeout(() => {
      if (!sawCallback) {
        setIsInView(true);
      }
    }, NO_CALLBACK_FALLBACK_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(noCallbackFallback);
    };
  }, [options]);

  return { ref, isInView };
}
