/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  env: {
    ONEINCH_API_KEY: process.env.ONEINCH_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    PRIVY_APP_ID: process.env.PRIVY_APP_ID,
  },
}

module.exports = nextConfig