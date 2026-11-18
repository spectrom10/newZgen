import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { categorySlugs } from './lib/categories';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(8),
    description: z.string().min(20).max(240),
    author: z.string().min(2),
    category: z.enum(categorySlugs),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    status: z.enum(['draft', 'published']).default('draft'),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    whatItMeansForYou: z.string().min(30),
    featured: z.boolean().default(false),
    sources: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  }).refine(data => !data.cover || !!data.coverAlt, {
    message: 'When cover is set, coverAlt must describe the image.',
    path: ['coverAlt'],
  }),
});
export const collections = { articles };
