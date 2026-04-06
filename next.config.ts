import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    MCP_SERVER_URL: process.env.MCP_SERVER_URL,
  },
};

export default nextConfig;
