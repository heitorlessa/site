// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import rehypeMermaid from 'rehype-mermaid';

// Project site lives at https://heitorlessa.github.io/site/
// `site` + `base` drive canonical URLs, sitemap, RSS and asset paths.
const site = process.env.SITE_URL ?? 'https://heitorlessa.github.io';
const base = process.env.SITE_BASE ?? '/site';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [
    // Vue powers the interactive islands; everything else ships zero JS.
    vue(),
    mdx(),
    sitemap(),
  ],
  markdown: {
    // Keep Shiki for code, but let ```mermaid fall through to rehype-mermaid,
    // which renders them to static inline SVG at build time (headless Chromium)
    // so readers get diagrams with zero client JS.
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    rehypePlugins: [
      [
        rehypeMermaid,
        {
          strategy: 'inline-svg',
          // Diagrams always render on the light "paper" card (both themes), so
          // these are tuned to that card and mirror the hand-built islands:
          // Atkinson type, terracotta-bordered "chip" nodes, muted edges.
          // Palette mirrors the hand-built islands' LIGHT tokens exactly, so the
          // two diagram families read as siblings. Dark mode is recolored in CSS
          // (global.css) since these are baked at build time.
          mermaidConfig: {
            theme: 'base',
            fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
            themeVariables: {
              fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
              fontSize: '16px',
              primaryColor: '#f1e3d8', // = --color-accent-wash (node fill)
              primaryBorderColor: '#a13d10', // = --color-accent (matches actor box)
              nodeBorder: '#a13d10',
              primaryTextColor: '#21221f', // = --color-text
              textColor: '#21221f',
              lineColor: '#46473f', // = --color-text-muted (edges)
              secondaryColor: '#e7e8e3', // = --color-surface-2
              tertiaryColor: '#fafbf8', // = --color-surface
              clusterBkg: '#e7e8e3',
              clusterBorder: '#c2c4ba', // = --color-border-strong
              edgeLabelBackground: '#fafbf8', // = --color-surface (the card)
            },
          },
          // Allow pinning to a pre-installed Chromium (e.g. a sandbox image
          // whose browser build differs from the playwright npm package).
          // CI runs `playwright install chromium`, so this stays unset there.
          launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
            : undefined,
        },
      ],
    ],
  },
});
