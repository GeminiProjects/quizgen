import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */

  // 开发环境代理 API 请求到 Cloudflare Workers
  async rewrites() {
    // 只在开发环境启用代理
    if (process.env.NODE_ENV === 'development') {
      return await Promise.resolve([
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:3001/api/v1/:path*',
        },
      ]);
    }
    return await Promise.resolve([]);
  },
};

export default nextConfig;
