// Autorise tout et référence le sitemap
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
    ],
    sitemap: 'https://pointeuse-xxxxx.vercel.app/sitemap.xml', // remplace par ton URL
  };
}
