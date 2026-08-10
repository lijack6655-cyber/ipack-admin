/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
