import useSWR from 'swr';

/**
 * 演讲数据类型
 */
export interface Lecture {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'paused' | 'ended';
  join_code: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  org_id: string | null;
  owner_id: string;
  _count?: {
    quiz_items: number;
    participants: number;
  };
}

/**
 * 演讲列表响应类型
 */
interface LecturesResponse {
  success: boolean;
  data: {
    data: Lecture[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

/**
 * 创建演讲请求参数
 */
export interface CreateLectureData {
  title: string;
  description?: string | null;
  org_id?: string | null;
  org_password?: string | null;
  starts_at: string;
}

/**
 * 更新演讲请求参数
 */
export interface UpdateLectureData {
  title?: string;
  description?: string | null;
  status?: 'not_started' | 'in_progress' | 'paused' | 'ended';
  starts_at?: string;
  ends_at?: string;
}

/**
 * 获取演讲列表
 */
export function useLectures() {
  const url = '/api/lectures';

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<LecturesResponse>(url, {
      // 3分钟内不重新请求
      dedupingInterval: 3 * 60 * 1000,
      // 错误重试间隔递增
      errorRetryInterval: 1000,
      // 最多重试3次
      errorRetryCount: 3,
      // 保留之前的数据
      keepPreviousData: true,
    });

  return {
    lectures: data?.data?.data || [],
    pagination: data?.data?.pagination,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

/**
 * 获取单个演讲详情
 */
export function useLecture(id: string | undefined) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    success: boolean;
    data: Lecture;
  }>(id ? `/api/lectures/${id}` : null, {
    // 演讲详情缓存时间
    dedupingInterval: 5 * 60 * 1000,
    // 在演讲进行中时，每30秒刷新一次
    refreshInterval: (response) => {
      if (response?.data?.status === 'in_progress') {
        return 30 * 1000;
      }
      return 0;
    },
    // 保留之前的数据
    keepPreviousData: true,
  });

  return {
    lecture: data?.data,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

/**
 * 演讲操作 hooks
 */
export function useLectureActions() {
  const { mutate: mutateList } = useLectures();

  /**
   * 创建演讲
   */
  const createLecture = async (data: CreateLectureData) => {
    const response = await fetch('/api/lectures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      // 如果有具体的错误信息，抛出该信息
      const errorMessage = result.error || result.message || '创建演讲失败';
      throw new Error(errorMessage);
    }

    // 乐观更新列表
    await mutateList();

    return result;
  };

  /**
   * 更新演讲
   */
  const updateLecture = async (id: string, data: UpdateLectureData) => {
    const response = await fetch(`/api/lectures/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || '更新演讲失败');
    }

    // 更新列表缓存
    await mutateList();

    return result;
  };

  /**
   * 删除演讲
   */
  const deleteLecture = async (id: string) => {
    const response = await fetch(`/api/lectures/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || result.error || '删除演讲失败');
    }

    // 更新列表缓存
    await mutateList();
  };

  /**
   * 开始演讲
   */
  const startLecture = (id: string) => {
    return updateLecture(id, { status: 'in_progress' });
  };

  /**
   * 暂停演讲
   */
  const pauseLecture = (id: string) => {
    return updateLecture(id, { status: 'paused' });
  };

  /**
   * 结束演讲
   */
  const endLecture = (id: string) => {
    return updateLecture(id, {
      status: 'ended',
      ends_at: new Date().toISOString(),
    });
  };

  /**
   * 验证加入码
   */
  const verifyJoinCode = async (joinCode: string) => {
    const response = await fetch(`/api/lectures/join/${joinCode}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || result.error || '验证失败');
    }

    return response.json();
  };

  return {
    createLecture,
    updateLecture,
    deleteLecture,
    startLecture,
    pauseLecture,
    endLecture,
    verifyJoinCode,
  };
}
