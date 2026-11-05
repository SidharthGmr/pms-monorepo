'use client';

import { Button } from '@/components/ui/button';
import { Maximize, Minimize } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Toggles browser fullscreen for the whole app: one click in, the next click back out.
 * State follows the fullscreenchange event, so leaving via Esc flips the icon back too.
 */
export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Checked in an effect: document does not exist during SSR, and iOS Safari has no API.
    setIsSupported(typeof document !== 'undefined' && !!document.documentElement.requestFullscreen);
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  if (!isSupported) return null;

  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // A denied request (e.g. not triggered by a user gesture) just leaves the screen as-is.
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-lg"
      onClick={() => void toggle()}
      title={isFullscreen ? 'Exit full screen' : 'Full screen'}
      aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
    >
      {isFullscreen ? <Minimize className="h-[18px] w-[18px]" /> : <Maximize className="h-[18px] w-[18px]" />}
    </Button>
  );
}
