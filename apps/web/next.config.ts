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
    serverActions: {
      // 支持最大 20MB 的文件上传
      // 这不是一个安全的举动，但我懒得写 S3 了（而且让部署起来也麻烦）
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
