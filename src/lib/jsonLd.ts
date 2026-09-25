/**
 * Serializes a JSON-LD object for embedding inside a <script
 * type="application/ld+json"> tag rendered via react-helmet-async.
 *
 * Escapes `<` so a value containing a literal "</script>" (e.g. admin-edited
 * settings/content text) can never prematurely close the script tag in the
 * emitted HTML — the standard mitigation for embedding JSON inside <script>.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
