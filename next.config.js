/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX
    || (process.env.VERCEL_ENV === 'production' ? 'https://ipack-admin.vercel.app' : undefined),
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
      ],
    },
  ],
};

module.exports = nextConfig;
