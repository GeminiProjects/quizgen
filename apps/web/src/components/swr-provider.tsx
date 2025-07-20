'use client';

import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';

/**
 * 全局 SWR 配置
 * 提供统一的缓存和错误处理
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
