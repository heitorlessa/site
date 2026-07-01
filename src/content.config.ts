import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Type-safe frontmatter for every post. Authoring mistakes fail the build
// rather than shipping broken metadata.
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(120),
      description: z.string().max(280),
      pubDate: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      hero: image().optional(),
      heroAlt: z.string().optional(),
    }),
});

export const collections = { blog };
