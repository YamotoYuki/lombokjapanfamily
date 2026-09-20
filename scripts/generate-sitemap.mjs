#!/usr/bin/env node
/**
 * Regenerates public/sitemap.xml with the static top-level pages plus
 * published blog posts, family profiles, and announcements pulled from the
 * public API.
 *
 * This is a manual/optional step, NOT part of `npm run build` — a flaky or
 * unreachable backend must never fail a Cloudflare Pages deploy. Run it by
 * hand (or on your own schedule) whenever new content is published:
 *
 *   node scripts/generate-sitemap.mjs
 *   SITE_URL=https://lombokjapanfamily.site API_BASE_URL=https://lombokjapanfamily.onrender.com/api node scripts/generate-sitemap.mjs
 *
 * The static sitemap.xml already committed to public/ covers the main
 * pages Google needs and keeps working even if this script is never run.
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITE_URL = (process.env.SITE_URL || 'https://lombokjapanfamily.site').replace(/\/$/, '');
const API_BASE_URL = (
  process.env.API_BASE_URL || 'https://lombokjapanfamily.onrender.com/api'
).replace(/\/$/, '');

const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/videos', changefreq: 'daily', priority: '0.9' },
  { loc: '/blog', changefreq: 'daily', priority: '0.9' },
  { loc: '/announcements', changefreq: 'daily', priority: '0.8' },
  { loc: '/family', changefreq: 'weekly', priority: '0.8' },
  { loc: '/gallery', changefreq: 'weekly', priority: '0.8' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
];

function isoDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const body = await res.json();
  return body?.data ?? body;
}

/** Loops /api/posts/public across pages (max limit 100 server-side). */
async function fetchAllPosts() {
  const items = [];
  let page = 1;
  for (;;) {
    const data = await fetchJson(
      `${API_BASE_URL}/posts/public?page=${page}&limit=100`,
    );
    const pageItems = data?.items ?? [];
    items.push(...pageItems);
    if (pageItems.length < 100 || items.length >= (data?.total ?? items.length)) break;
    page += 1;
  }
  return items;
}

async function fetchAllAnnouncements() {
  const items = [];
  let page = 1;
  for (;;) {
    const data = await fetchJson(
      `${API_BASE_URL}/announcements?published_only=true&page=${page}&limit=100`,
    );
    const pageItems = data?.items ?? [];
    items.push(...pageItems);
    if (pageItems.length < 100 || items.length >= (data?.total ?? items.length)) break;
    page += 1;
  }
  return items;
}

async function fetchAllFamily() {
  const data = await fetchJson(`${API_BASE_URL}/family?visible_only=true`);
  return data?.items ?? [];
}

function urlEntry({ loc, changefreq, priority, lastmod }) {
  return [
    '  <url>',
    `    <loc>${SITE_URL}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function main() {
  const entries = STATIC_PAGES.map((page) => urlEntry(page));

  const sources = [
    {
      label: 'blog posts',
      run: fetchAllPosts,
      toEntry: (post) =>
        post.slug
          ? urlEntry({
              loc: `/blog/${post.slug}`,
              changefreq: 'monthly',
              priority: '0.6',
              lastmod: isoDate(post.updated_at || post.published_at),
            })
          : null,
    },
    {
      label: 'announcements',
      run: fetchAllAnnouncements,
      toEntry: (item) =>
        item.id
          ? urlEntry({
              loc: `/announcements/${item.id}`,
              changefreq: 'monthly',
              priority: '0.5',
              lastmod: isoDate(item.updated_at || item.published_at),
            })
          : null,
    },
    {
      label: 'family profiles',
      run: fetchAllFamily,
      toEntry: (item) =>
        item.id
          ? urlEntry({
              loc: `/family/${item.id}`,
              changefreq: 'monthly',
              priority: '0.5',
              lastmod: isoDate(item.updated_at),
            })
          : null,
    },
  ];

  for (const source of sources) {
    try {
      const items = await source.run();
      const added = items.map(source.toEntry).filter(Boolean);
      entries.push(...added);
      console.log(`[sitemap] ${source.label}: added ${added.length}`);
    } catch (err) {
      console.warn(
        `[sitemap] skipping ${source.label} (fetch failed): ${err.message}`,
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  const outPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'public',
    'sitemap.xml',
  );
  await writeFile(outPath, xml, 'utf8');
  console.log(`[sitemap] wrote ${entries.length} URLs to ${outPath}`);
}

main().catch((err) => {
  console.error('[sitemap] failed:', err);
  process.exitCode = 1;
});
