/**
 * Optional Sentry bootstrap.
 * Install `@sentry/react` and set `VITE_SENTRY_DSN` to enable browser error reporting.
 * Kept import-free so production builds succeed without the optional package.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  // Soft hook for environments that inject Sentry via script tag / CDN.
  const injected = (
    window as unknown as {
      Sentry?: { init?: (opts: Record<string, unknown>) => void };
    }
  ).Sentry;

  if (injected?.init) {
    injected.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    });
    return;
  }

  console.info(
    '[sentry] VITE_SENTRY_DSN is set. Install @sentry/react (or inject window.Sentry) to activate.',
  );
}
