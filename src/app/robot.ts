// Autorise tout et référence le sitemap
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
    ],
    sitemap: 'https://pointeuse-six.vercel.app/', // remplace par ton URL
  };
}
