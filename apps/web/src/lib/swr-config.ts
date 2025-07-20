import type { SWRConfiguration } from 'swr';

/**
 * 全局 SWR 配置
 */
export const swrConfig: SWRConfiguration = {
  // 请求相关配置
  fetcher: async (url: string) => {
    const res = await fetch(url);

    if (!res.ok) {
      const error = new Error('An error occurred while fetching the data.');
      // @ts-expect-error
      error.info = await res.json();
      // @ts-expect-error
      error.status = res.status;
      throw error;
    }

    return res.json();
  },

  // 缓存配置
  dedupingInterval: 2000, // 2秒内相同请求只发送一次
  focusThrottleInterval: 5000, // 5秒内窗口聚焦只触发一次重新验证

  // 错误重试配置
  errorRetryCount: 3,
  errorRetryInterval: 1000,

  // 性能优化配置
  keepPreviousData: true, // 保持之前的数据直到新数据加载完成
  revalidateIfStale: false, // 过期时不自动重新验证
  revalidateOnFocus: false, // 窗口聚焦时不自动重新验证
  revalidateOnReconnect: true, // 断网重连时重新验证

  // 加载状态配置
  loadingTimeout: 3000, // 3秒后显示 slow loading 状态

  // 缓存提供者（可以在这里配置 localStorage 持久化）
  provider: () => new Map(),
};

/**
 * 预加载数据的辅助函数
 */
export const preloadData = async (key: string) => {
  try {
    const data = await swrConfig.fetcher?.(key);
    // 将数据存入 SWR 缓存
    if (data) {
      // @ts-expect-error
      window.__SWR_CACHE__?.set(key, data);
    }
  } catch (error) {
    console.error('Preload failed:', error);
  }
};
