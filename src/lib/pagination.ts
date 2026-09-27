export const DEFAULT_PAGE_SIZE = 10;

/** `Math.ceil` on 0 items still yields 1 "page" worth of chrome to hide. */
export function computeTotalPages(total: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}

export type PageItem = number | 'ellipsis';

/**
 * A short run of page numbers around `current`, plus the first and last
 * page, with 'ellipsis' markers bridging any gaps — the standard
 * "1 2 3 4 5 … 20" / "1 … 8 9 10 11 12 … 20" pagination window.
 */
export function getPageWindow(
  current: number,
  totalPages: number,
  windowSize = 5,
): PageItem[] {
  if (totalPages <= windowSize + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, current - half);
  let end = start + windowSize - 1;
  if (end > totalPages) {
    end = totalPages;
    start = end - windowSize + 1;
  }

  const items: PageItem[] = [];
  if (start > 1) {
    items.push(1);
    if (start > 2) items.push('ellipsis');
  }
  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }
  if (end < totalPages) {
    if (end < totalPages - 1) items.push('ellipsis');
    items.push(totalPages);
  }
  return items;
}
