import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
    ],
  },
  experimental: {
    // 优化生产环境性能
    staleTimes: {
      dynamic: 30, // 动态数据缓存30秒
      static: 180, // 静态数据缓存3分钟
    },
  },
};

export default nextConfig;
