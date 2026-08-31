/** Public Turnstile site key (empty when unset → widget disabled). */
export function getTurnstileSiteKey(): string {
  return (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || '';
}
