import type { APIRoute } from 'astro';
import { publishedArticles, articlePath } from '../lib/articles';
import { categories } from '../lib/categories';
export const GET: APIRoute = async ({site}) => {
  const articles=await publishedArticles();
  const routes=['/','/about',...categories.map(c=>`/topics/${c.slug}`),...articles.map(articlePath)];
  const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(path=>`<url><loc>${new URL(path,site).toString()}</loc></url>`).join('')}</urlset>`;
  return new Response(xml,{headers:{'Content-Type':'application/xml'}});
};
