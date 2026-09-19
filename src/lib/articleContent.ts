/**
 * Shared helpers for the announcement/blog detail pages — kept as plain
 * functions (not components) so both pages can use them without any
 * dependency between the two page components themselves.
 */

/**
 * Split a plain-text article body into paragraphs on blank lines.
 *
 * Content can come from a Windows-authored source with \r\n line endings.
 * A plain /\n{2,}/ match never fires on "\r\n\r\n" (there's only ever one
 * \n at a time, separated by \r), so without normalizing first, the whole
 * body collapses into a single paragraph and the raw \r\n\r\n renders as
 * large visible gaps under white-space: pre-wrap.
 */
export function splitArticleParagraphs(content?: string | null): string[] {
  if (!content) return [];
  return content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/** News-masthead-style "2026.09.15" date — deliberately locale-independent. */
export function articleDateLabel(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}
