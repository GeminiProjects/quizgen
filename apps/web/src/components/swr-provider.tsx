'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

/**
 * 全局 SWR 配置
 * 提供统一的缓存和错误处理
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        // 全局 fetcher 函数
        fetcher: async (url: string) => {
          const res = await fetch(url);
          if (!res.ok) {
            const error = new Error('请求失败');
            // @ts-expect-error 添加额外信息
            error.info = await res.json();
            // @ts-expect-error 添加状态码
            error.status = res.status;
            throw error;
          }
          return res.json();
        },
        // 错误重试配置
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        // 自动重新验证配置
        revalidateOnFocus: false, // 窗口聚焦时不自动重新验证
        revalidateOnReconnect: true, // 网络重连时重新验证
        // 去重时间间隔
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
