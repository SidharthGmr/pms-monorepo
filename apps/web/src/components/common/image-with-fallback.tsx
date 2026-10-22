'use client';
import { ReactNode, useEffect, useState } from 'react';

interface ImageWithFallbackProps {
  /** Image URL. Empty/undefined renders the fallback straight away. */
  src?: string | null;
  /** Shown when there is no URL or the one stored no longer loads (deleted upload, dead CDN link). */
  fallback: ReactNode;
  alt?: string;
  className?: string;
}

/**
 * An <img> that can never show the browser's broken-image icon: a missing src, or a src that
 * 404s, swaps to the caller's placeholder instead. Plain <img> on purpose - these thumbnails
 * come from arbitrary CDNs, and next/image would need every host allow-listed.
 */
export default function ImageWithFallback({ src, fallback, alt = '', className }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  // A list row can be recycled with a new product, so a previous failure must not stick.
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) return <>{fallback}</>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
