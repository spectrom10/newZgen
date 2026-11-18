/** Editorial categories are defined once, then reused across every view. */
export const categories = [
  { slug: 'business', name: 'Business', description: 'Companies, strategy and the decisions shaping markets.' },
  { slug: 'economics', name: 'Economics', description: 'Prices, jobs, housing and the forces behind them.' },
  { slug: 'politics', name: 'Politics', description: 'Policy, international relations and their consequences.' },
  { slug: 'technology', name: 'Technology', description: 'Innovation, AI, engineering and their economic impact.' },
  { slug: 'sports', name: 'Sports', description: 'Sport and the business behind it.' },
  { slug: 'science-health', name: 'Science & Health', description: 'Discovery, medicine and the industries involved.' },
  { slug: 'culture', name: 'Culture', description: 'Entertainment, society and the creative economy.' },
  { slug: 'life', name: 'Life', description: 'Education, work, money and everyday decisions.' },
] as const;
export type CategorySlug = (typeof categories)[number]['slug'];
export const categorySlugs = categories.map(c => c.slug) as [CategorySlug, ...CategorySlug[]];
export const categoryBySlug = (slug: string) => categories.find(c => c.slug === slug);
