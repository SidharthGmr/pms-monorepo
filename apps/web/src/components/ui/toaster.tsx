"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, AlertTriangle, Info } from "lucide-react"
import { useEffect } from "react"

const toasterStyles = `
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}
.animate-toast-progress {
  animation: toast-progress 4800ms linear forwards;
}
`;

const ToastChimeTrigger = ({ variant }: { variant?: string }) => {
  useEffect(() => {
    if (variant === 'success' || variant === 'destructive') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          
          // Resume if suspended (browser policy restriction)
          if (ctx.state === 'suspended') {
            ctx.resume();
          }

          if (variant === 'success') {
            // A premium glass chime sound with triangle, sine, and overtone oscillators for rich acoustic depth
            const playChimeNote = (freq: number, startTime: number, duration: number, volume: number = 0.08) => {
              const now = ctx.currentTime;
              const start = now + startTime;
              
              // Triangle wave for the woody/glassy chime body
              const oscTri = ctx.createOscillator();
              const gainTri = ctx.createGain();
              oscTri.type = 'triangle';
              oscTri.frequency.setValueAtTime(freq, start);
              
              // Sine wave for pure frequency base
              const oscSine = ctx.createOscillator();
              const gainSine = ctx.createGain();
              oscSine.type = 'sine';
              oscSine.frequency.setValueAtTime(freq, start);

              // A high harmonic/overtone for a bright sparkle
              const oscOvertone = ctx.createOscillator();
              const gainOvertone = ctx.createGain();
              oscOvertone.type = 'sine';
              oscOvertone.frequency.setValueAtTime(freq * 2, start);

              // Configure envelopes (pluck attack, warm exponential release)
              gainTri.gain.setValueAtTime(0, start);
              gainTri.gain.linearRampToValueAtTime(volume * 0.6, start + 0.02);
              gainTri.gain.exponentialRampToValueAtTime(0.0001, start + duration);

              gainSine.gain.setValueAtTime(0, start);
              gainSine.gain.linearRampToValueAtTime(volume * 0.4, start + 0.02);
              gainSine.gain.exponentialRampToValueAtTime(0.0001, start + duration);

              gainOvertone.gain.setValueAtTime(0, start);
              gainOvertone.gain.linearRampToValueAtTime(volume * 0.2, start + 0.01);
              gainOvertone.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.5);

              // Connect everything
              oscTri.connect(gainTri);
              gainTri.connect(ctx.destination);

              oscSine.connect(gainSine);
              gainSine.connect(ctx.destination);

              oscOvertone.connect(gainOvertone);
              gainOvertone.connect(ctx.destination);

              // Playback timing
              oscTri.start(start);
              oscTri.stop(start + duration);
              oscSine.start(start);
              oscSine.stop(start + duration);
              oscOvertone.start(start);
              oscOvertone.stop(start + duration);
            };

            // Play a beautiful premium C-major 9th ascending glass chime arpeggio:
            // Notes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), C6 (1046.50), E6 (1318.51)
            playChimeNote(523.25, 0.00, 0.6, 0.08);   // C5
            playChimeNote(659.25, 0.07, 0.6, 0.08);   // E5
            playChimeNote(783.99, 0.14, 0.7, 0.08);   // G5
            playChimeNote(987.77, 0.21, 0.8, 0.06);   // B5
            playChimeNote(1046.50, 0.28, 0.9, 0.08);  // C6
            playChimeNote(1318.51, 0.35, 1.2, 0.10);  // E6
          } else if (variant === 'destructive') {
            // A warm, low, descending warning sound to signal danger/error
            const playWarningNote = (freq: number, startTime: number, duration: number, volume: number = 0.1) => {
              const now = ctx.currentTime;
              const start = now + startTime;
              
              // Sawtooth wave for warning texture, filtered by low pass to make it pleasant
              const oscSaw = ctx.createOscillator();
              const gainSaw = ctx.createGain();
              oscSaw.type = 'sawtooth';
              oscSaw.frequency.setValueAtTime(freq, start);

              // Lowpass filter to avoid harshness
              const filter = ctx.createBiquadFilter();
              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(850, start);
              
              // Sine wave for solid base warning tone
              const oscSine = ctx.createOscillator();
              const gainSine = ctx.createGain();
              oscSine.type = 'sine';
              oscSine.frequency.setValueAtTime(freq, start);

              // Configure envelopes
              gainSaw.gain.setValueAtTime(0, start);
              gainSaw.gain.linearRampToValueAtTime(volume * 0.35, start + 0.03);
              gainSaw.gain.exponentialRampToValueAtTime(0.0001, start + duration);

              gainSine.gain.setValueAtTime(0, start);
              gainSine.gain.linearRampToValueAtTime(volume * 0.65, start + 0.03);
              gainSine.gain.exponentialRampToValueAtTime(0.0001, start + duration);

              // Connect
              oscSaw.connect(gainSaw);
              gainSaw.connect(filter);
              filter.connect(ctx.destination);

              oscSine.connect(gainSine);
              gainSine.connect(ctx.destination);

              oscSaw.start(start);
              oscSaw.stop(start + duration);
              oscSine.start(start);
              oscSine.stop(start + duration);
            };

            // Play a soft warning melody sequence: F4 (349.23 Hz) -> D4 (293.66 Hz) -> Ab3 (207.65 Hz)
            playWarningNote(349.23, 0.00, 0.35, 0.08); // F4
            playWarningNote(293.66, 0.10, 0.35, 0.08); // D4
            playWarningNote(207.65, 0.20, 0.60, 0.12); // Ab3 (low tension note)
          }
        }
      } catch (err) {
        console.error('Failed to play toast chime:', err);
      }
    }
  }, [variant]);

  return null;
};

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      <style dangerouslySetInnerHTML={{ __html: toasterStyles }} />
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const variant = props.variant || 'default';
        const Icon = variant === 'success' ? CheckCircle2
          : variant === 'destructive' ? AlertTriangle
          : Info;
        const iconColor = variant === 'success' ? 'text-emerald-500'
          : variant === 'destructive' ? 'text-rose-500'
          : 'text-primary';
        const progressBg = variant === 'success' ? 'bg-emerald-500'
          : variant === 'destructive' ? 'bg-rose-500'
          : 'bg-primary';

        return (
          <Toast key={id} {...props} className="relative overflow-hidden min-w-[340px] pr-12 flex flex-col items-stretch gap-1">
            <ToastChimeTrigger variant={variant} />
            <div className="flex gap-3.5 items-start w-full">
              <div className={`p-1.5 rounded-xl bg-slate-500/5 ${iconColor} shrink-0 mt-0.5`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="grid gap-0.5 flex-1 min-w-0">
                {title && <ToastTitle className="font-bold text-sm text-foreground leading-snug">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-xs text-muted-foreground leading-relaxed">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action && <div className="mt-2 pl-10 w-full flex">{action}</div>}
            <ToastClose className="rounded-full hover:bg-muted p-1 text-muted-foreground/60 transition-colors" />
            
            {/* Countdown Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-muted/30">
              <div className={`h-full ${progressBg} animate-toast-progress`} />
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
