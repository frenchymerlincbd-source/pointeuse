import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://pointeuse-six.vercel.app/'; // remplace par ton URL

  const pages = [
    '',                // /
    '/pointer',
    '/employes',
    '/planning/week',
    '/pointages',
    '/alertes',
    '/dashboard',
  ];

  const now = new Date();

  return pages.map((p) => ({
    url: base + p,
    lastModified: now,
    changeFrequency: 'daily',
    priority: p === '' ? 1 : 0.8,
  }));
}
