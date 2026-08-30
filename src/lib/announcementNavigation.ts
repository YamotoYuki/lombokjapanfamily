/** Scroll restore when returning from announcement detail. */
export const ANNOUNCEMENT_SCROLL_KEY = 'ljf_announcement_scroll_y';
export const ANNOUNCEMENT_RETURN_PATH_KEY = 'ljf_announcement_return_path';

export function rememberAnnouncementNavigation(pathname: string) {
  try {
    sessionStorage.setItem(ANNOUNCEMENT_SCROLL_KEY, String(window.scrollY));
    sessionStorage.setItem(ANNOUNCEMENT_RETURN_PATH_KEY, pathname);
  } catch {
    // ignore quota / private mode
  }
}

export function consumeAnnouncementScrollY(): number | null {
  try {
    const raw = sessionStorage.getItem(ANNOUNCEMENT_SCROLL_KEY);
    sessionStorage.removeItem(ANNOUNCEMENT_SCROLL_KEY);
    if (raw == null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function peekAnnouncementReturnPath(): string | null {
  try {
    return sessionStorage.getItem(ANNOUNCEMENT_RETURN_PATH_KEY);
  } catch {
    return null;
  }
}
