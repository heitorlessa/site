// Single source of truth for site-wide metadata.
export const SITE_TITLE = 'Notes by Lessa';
export const SITE_DESCRIPTION =
  'Calm, distraction-free notes on building software — with interactive diagrams that make the mental models stick.';
export const SITE_AUTHOR = 'Heitor Lessa';
export const SITE_LANG = 'en';

// Base path (e.g. "/site") injected by Astro from astro.config `base`.
// Joins a path onto the base with exactly one slash between them, so internal
// links work under a sub-path deploy regardless of whether BASE_URL has a
// trailing slash ("/site" vs "/site/").
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, ''); // drop trailing slash(es)
  const rest = String(path).replace(/^\/+/, ''); // drop leading slash(es)
  const joined = rest ? `${base}/${rest}` : `${base}/`;
  return joined.replace(/([^:]\/)\/+/g, '$1'); // collapse accidental doubles
}

export const NAV_LINKS = [
  { href: '/', label: 'Notes' },
  { href: '/demos', label: 'Interactive' },
  { href: '/about', label: 'About' },
] as const;
