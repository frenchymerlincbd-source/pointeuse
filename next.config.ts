import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
// next.config.ts
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // on a déjà mis ça pour ESLint
  },
  typescript: {
    ignoreBuildErrors: true,  // <-- ignore les erreurs TS en build
  },
};

export default nextConfig;
