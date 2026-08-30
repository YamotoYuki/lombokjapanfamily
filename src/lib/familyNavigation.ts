/** Keys for restoring scroll when returning from Family detail. */
export const FAMILY_SCROLL_KEY = 'ljf_family_scroll_y';
export const FAMILY_RETURN_PATH_KEY = 'ljf_family_return_path';

export function rememberFamilyNavigation(pathname: string) {
  try {
    sessionStorage.setItem(FAMILY_SCROLL_KEY, String(window.scrollY));
    sessionStorage.setItem(FAMILY_RETURN_PATH_KEY, pathname);
  } catch {
    // ignore quota / private mode
  }
}

export function consumeFamilyScrollY(): number | null {
  try {
    const raw = sessionStorage.getItem(FAMILY_SCROLL_KEY);
    sessionStorage.removeItem(FAMILY_SCROLL_KEY);
    if (raw == null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function peekFamilyReturnPath(): string | null {
  try {
    return sessionStorage.getItem(FAMILY_RETURN_PATH_KEY);
  } catch {
    return null;
  }
}
