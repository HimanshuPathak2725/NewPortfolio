import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    interactive: z.enum(['world-models', 'research-essay']).optional(),
    hero: z.object({
      src: z.string(),
      alt: z.string(),
      width: z.number().positive(),
      height: z.number().positive(),
      caption: z.string().optional(),
    }).optional(),
  }),
});

export const collections = { blog };
