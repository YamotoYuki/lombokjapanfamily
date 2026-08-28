import { useState, type ImgHTMLAttributes } from 'react';

type LazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
  /** Candidate widths for srcset (Unsplash / similar CDN query params). */
  widths?: number[];
};

function buildSrcSet(src: string, widths: number[]) {
  if (!src || widths.length === 0 || typeof window === 'undefined') {
    return undefined;
  }
  try {
    const url = new URL(src, window.location.origin);
    if (
      !url.hostname.includes('unsplash.com') &&
      !url.hostname.includes('images.unsplash.com') &&
      !url.searchParams.has('w')
    ) {
      return undefined;
    }
    return widths
      .map((width) => {
        const next = new URL(url.toString());
        next.searchParams.set('w', String(width));
        if (!next.searchParams.has('auto')) {
          next.searchParams.set('auto', 'format');
        }
        if (!next.searchParams.has('fit')) {
          next.searchParams.set('fit', 'crop');
        }
        return `${next.toString()} ${width}w`;
      })
      .join(', ');
  } catch {
    return undefined;
  }
}

/** Lazy-loading image with optional srcset / WebP-friendly CDN params. */
export default function LazyImage({
  alt,
  className = '',
  fallbackSrc,
  loading = 'lazy',
  decoding = 'async',
  widths = [480, 768, 1280],
  src,
  srcSet,
  sizes = '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw',
  onError,
  ...props
}: LazyImageProps) {
  const [failed, setFailed] = useState(false);
  const computedSrcSet =
    srcSet || (typeof src === 'string' ? buildSrcSet(src, widths) : undefined);

  if (failed && fallbackSrc) {
    return (
      <img
        {...props}
        src={fallbackSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={className}
      />
    );
  }

  return (
    <img
      {...props}
      src={src}
      srcSet={computedSrcSet}
      sizes={computedSrcSet ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
