'use client';

import useSWR from 'swr';

// 参与的演讲数据类型
export interface ParticipatedLecture {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  org_id: string | null;
  status: 'not_started' | 'in_progress' | 'paused' | 'ended';
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  joined_at: string;
  owner_name: string | null;
  owner_email: string | null;
  _count: {
    quiz_items: number;
  };
}

/**
 * 参与响应类型
 */
interface ParticipationResponse {
  success: boolean;
  data: ParticipatedLecture[];
  message?: string;
}

/**
 * 获取用户参与的演讲列表
 */
export function useParticipation() {
  const { data, error, isLoading, mutate } = useSWR<ParticipationResponse>(
    '/api/participation',
    {
      // 5分钟内不重新请求
      dedupingInterval: 5 * 60 * 1000,
      // 错误重试间隔递增
      errorRetryInterval: 1000,
      // 最多重试3次
      errorRetryCount: 3,
      // 保持之前的数据直到新数据加载完成
      keepPreviousData: true,
      // 重新验证时保持数据
      revalidateIfStale: false,
      // 窗口聚焦时不自动重新验证（已在组件中手动处理）
      revalidateOnFocus: false,
      // 断网重连时重新验证
      revalidateOnReconnect: true,
    }
  );

  return {
    participations: data?.data || [],
    isLoading,
    isValidating: !data && isLoading,
    error,
    mutate,
  };
}
