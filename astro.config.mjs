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
          mermaidConfig: {
            theme: 'base',
            fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
            themeVariables: {
              fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
              fontSize: '15px',
              primaryColor: '#f0e6dc',
              primaryBorderColor: '#c2410c',
              primaryTextColor: '#21221f',
              secondaryColor: '#e6e3db',
              tertiaryColor: '#f6f6f3',
              lineColor: '#6b6357',
              textColor: '#21221f',
              clusterBkg: '#eceae3',
              clusterBorder: '#b9bbb1',
              edgeLabelBackground: '#f6f6f3',
              nodeBorder: '#c2410c',
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
