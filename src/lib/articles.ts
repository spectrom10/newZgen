import { getCollection, type CollectionEntry } from 'astro:content';
import { categories, type CategorySlug } from './categories';
export type Article = CollectionEntry<'articles'>;
export async function publishedArticles(): Promise<Article[]> {
  const all = await getCollection('articles', ({ data }) => data.status === 'published' && data.publishedAt <= new Date());
  return all.sort((a,b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}
export const articlePath = (article: Article) => `/articles/${article.id}`;
export const topicPath = (slug: CategorySlug) => `/topics/${slug}`;
export const readingTime = (article: Article) => {
  const wordCount = (article.body || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
};
export function relatedArticles(current: Article, others: Article[], limit = 3) {
  return others.filter(a => a.id !== current.id).sort((a,b) => Number(b.data.category === current.data.category) - Number(a.data.category === current.data.category)).slice(0, limit);
}
export function categoryName(slug: string) {
  return categories.find(c=>c.slug===slug)?.name || slug;
}
export const dateLabel = (date: Date) => new Intl.DateTimeFormat('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'}).format(date);
