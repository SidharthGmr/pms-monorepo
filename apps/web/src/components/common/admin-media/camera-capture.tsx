'use client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Camera, Check, Loader2, RefreshCw, RotateCcw, SwitchCamera, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraFacing = 'environment' | 'user';

type CameraStatus = 'starting' | 'live' | 'error';

const JPEG_QUALITY = 0.92;
const IDEAL_WIDTH = 1920;
const IDEAL_HEIGHT = 1080;

/** How a photo can be taken here: the in-app dialog, the device's own camera app, or not at all. */
export type CameraMode = 'stream' | 'native' | 'none';

const isTouchDevice = () => typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);

/**
 * What this browser can actually do. getUserMedia - and so the live preview dialog - only exists
 * on a secure origin, which rules out a dev server reached over a plain-http LAN address such as
 * http://192.168.x.x:3000. A phone there still has a camera, and a file input carrying the
 * `capture` attribute opens it, so that is the fallback rather than hiding the feature. Returns
 * null until the check has run so a button does not flash in and out on the first paint.
 */
export function useCameraAvailability(): CameraMode | null {
  const [mode, setMode] = useState<CameraMode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const settle = (value: CameraMode) => {
      if (!cancelled) setMode(value);
    };

    const check = async () => {
      if (typeof navigator === 'undefined') return settle('none');
      if (!navigator.mediaDevices?.getUserMedia) return settle(isTouchDevice() ? 'native' : 'none');

      // enumerateDevices needs no permission for the device count - only the labels are withheld
      // until the user grants access - but older Safari builds leave it off mediaDevices.
      if (!navigator.mediaDevices.enumerateDevices) return settle('stream');
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (devices.some((device) => device.kind === 'videoinput')) return settle('stream');
        return settle(isTouchDevice() ? 'native' : 'none');
      } catch {
        return settle('stream');
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return mode;
}

/**
 * Hands the shot off to the device's own camera app through a throwaway file input. This is the
 * only route on an insecure origin, and it needs no permission prompt of its own. The input is
 * never mounted: a detached one still opens the picker as long as the click comes from a real
 * user gesture.
 */
export const openNativeCamera = (facingMode: CameraFacing = 'environment'): Promise<File | null> =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = facingMode;

    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      resolve(file);
    };

    input.addEventListener('change', () => finish(input.files?.[0] ?? null), { once: true });
    // A dismissed picker fires `cancel` in current browsers and nothing at all in older ones,
    // where the window regaining focus is the only hint that the user backed out.
    input.addEventListener('cancel', () => finish(null), { once: true });
    window.addEventListener('focus', () => window.setTimeout(() => finish(input.files?.[0] ?? null), 500), { once: true });

    input.click();
  });

const messageForError = (error: unknown): string => {
  switch ((error as DOMException)?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was blocked. Allow the camera for this site in your browser settings, then try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device.';
    case 'NotReadableError':
      return 'The camera is already in use by another app or tab. Close it and try again.';
    default:
      return (error as Error)?.message || 'The camera could not be started.';
  }
};

interface CameraCaptureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the captured still as a JPEG File. Keep `busy` true while it is being uploaded,
   *  and return false to hold the dialog open so a failed upload can be retried or retaken. */
  onCapture: (file: File) => boolean | void | Promise<boolean | void>;
  /** Which camera to open first - the rear one by default, which is what product shots want. */
  facingMode?: CameraFacing;
  /** What is being photographed, used in the dialog copy, e.g. "product photo". */
  label?: string;
  /** Shows a spinner on Use photo and holds the dialog open while the caller uploads. */
  busy?: boolean;
}

/**
 * Live camera dialog: preview, shoot, retake, confirm. The confirmed still is handed back as a
 * JPEG File so the caller can push it through the same upload path as a picked file - this
 * component never talks to the storage backend itself.
 */
export function CameraCaptureDialog({
  isOpen,
  onClose,
  onCapture,
  facingMode = 'environment',
  label = 'photo',
  busy = false,
}: CameraCaptureDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoUrlRef = useRef<string | null>(null);

  const [status, setStatus] = useState<CameraStatus>('starting');
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraFacing>(facingMode);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [photo, setPhoto] = useState<{ url: string; blob: Blob } | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const discardPhoto = useCallback(() => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = null;
    setPhoto(null);
  }, []);

  // One effect owns the stream: it opens on every (re)open, camera switch and retry, and its
  // cleanup stops the tracks so the camera indicator goes out the moment the dialog closes.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setStatus('starting');
    setError(null);

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('Camera is not available in this browser.', 'NotFoundError');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: IDEAL_WIDTH }, height: { ideal: IDEAL_HEIGHT } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setStatus('live');

        const devices = (await navigator.mediaDevices.enumerateDevices?.()) ?? [];
        if (!cancelled) setHasMultipleCameras(devices.filter((device) => device.kind === 'videoinput').length > 1);
      } catch (cameraError) {
        if (cancelled) return;
        setError(messageForError(cameraError));
        setStatus('error');
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [isOpen, facing, retryToken, stopStream]);

  useEffect(() => {
    if (!isOpen) {
      discardPhoto();
      setFacing(facingMode);
    }
  }, [isOpen, facingMode, discardPhoto]);

  useEffect(() => () => discardPhoto(), [discardPhoto]);

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    // The front-camera preview is mirrored for the person holding the device, but the saved
    // still deliberately is not: a mirrored shot of a label or a shelf tag reads backwards.
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        discardPhoto();
        const url = URL.createObjectURL(blob);
        photoUrlRef.current = url;
        setPhoto({ url, blob });
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  }, [discardPhoto]);

  const confirmPhoto = async () => {
    if (!photo) return;
    await onCapture(new File([photo.blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Take {label}</DialogTitle>
          <DialogDescription>
            {photo ? 'Keep this shot or retake it. It uploads to your media library once you confirm.' : 'Line up the shot, then press Capture.'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={cn('h-full w-full object-cover', facing === 'user' && '-scale-x-100', (status !== 'live' || !!photo) && 'invisible')}
          />

          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt={`Captured ${label}`} className="absolute inset-0 h-full w-full object-cover" />
          )}

          {!photo && status === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Starting camera...</span>
            </div>
          )}

          {!photo && status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white/80">
              <TriangleAlert className="h-6 w-6 text-amber-400" />
              <span className="text-xs leading-relaxed">{error}</span>
            </div>
          )}

          {!photo && status === 'live' && hasMultipleCameras && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-3 top-3 h-9 w-9 rounded-full"
              title="Switch camera"
              onClick={() => setFacing((current) => (current === 'environment' ? 'user' : 'environment'))}
            >
              <SwitchCamera className="h-4 w-4" />
            </Button>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-center">
          {photo ? (
            <>
              <Button type="button" variant="outline" className="gap-1.5" disabled={busy} onClick={discardPhoto}>
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <Button type="button" className="gap-1.5" disabled={busy} onClick={() => void confirmPhoto()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {busy ? 'Uploading...' : 'Use photo'}
              </Button>
            </>
          ) : status === 'error' ? (
            <Button type="button" variant="outline" className="gap-1.5" onClick={() => setRetryToken((token) => token + 1)}>
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          ) : (
            <Button type="button" className="gap-1.5" disabled={status !== 'live'} onClick={takePhoto}>
              <Camera className="h-4 w-4" />
              Capture
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CameraCaptureButtonProps extends Omit<CameraCaptureDialogProps, 'isOpen' | 'onClose'> {
  text?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Drop-in "Take photo" button. It renders nothing on a device with no camera, opens the live
 * dialog where getUserMedia is available, and otherwise falls through to the device's camera
 * app - so the same button keeps working on a phone pointed at an http dev server.
 */
export default function CameraCaptureButton({ onCapture, text = 'Take photo', disabled, className, ...dialogProps }: CameraCaptureButtonProps) {
  const mode = useCameraAvailability();
  const [isOpen, setIsOpen] = useState(false);
  const [isNativePending, setIsNativePending] = useState(false);

  if (mode === null || mode === 'none') return null;

  const takeNativePhoto = async () => {
    setIsNativePending(true);
    try {
      const file = await openNativeCamera(dialogProps.facingMode);
      if (file) await onCapture(file);
    } finally {
      setIsNativePending(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn('h-8 gap-1.5', className)}
        disabled={disabled || isNativePending}
        onClick={() => (mode === 'native' ? void takeNativePhoto() : setIsOpen(true))}
      >
        <Camera className="h-3.5 w-3.5" />
        {text}
      </Button>

      {isOpen && (
        <CameraCaptureDialog
          {...dialogProps}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onCapture={async (file) => {
            const result = await onCapture(file);
            if (result !== false) setIsOpen(false);
            return result;
          }}
        />
      )}
    </>
  );
}
