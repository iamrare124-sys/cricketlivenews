import { getPostsForSitemap } from '@/lib/supabase';
import siteConfig from '@/config/site.config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cricketlivenews.in';

export default async function sitemap() {
  // Static pages
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/cookie-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Category pages
  const categoryPages = siteConfig.categories.map((cat) => ({
    url: `${SITE_URL}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Dynamic post pages
  let postPages = [];
  try {
    const posts = await getPostsForSitemap();
    postPages = posts.map((post) => ({
      url: `${SITE_URL}/${post.slug}`,
      lastModified: new Date(post.published_at),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));
  } catch {
    postPages = [];
  }

  return [...staticPages, ...categoryPages, ...postPages];
}
