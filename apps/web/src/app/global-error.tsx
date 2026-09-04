'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary for errors thrown by the root layout itself, where
 * `error.tsx` cannot render because the layout that would host it has failed.
 * It has to supply its own <html>/<body>, and it cannot rely on the app's CSS
 * or providers being alive, so the styling is inline and self-contained.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Kept as console.error so the compiler's removeConsole leaves it in place.
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: '#475569', maxWidth: '32rem', marginTop: '0.75rem' }}>
            The application hit an unexpected error. You can try again, or reload the page.
            {error.digest ? (
              <>
                <br />
                <span style={{ fontSize: '0.8rem' }}>Reference: {error.digest}</span>
              </>
            ) : null}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '0.5rem',
                border: '1px solid #0f172a',
                background: '#0f172a',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '0.5rem',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              Go home
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
