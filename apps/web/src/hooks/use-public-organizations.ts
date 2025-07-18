import useSWR from 'swr';

/**
 * 公开组织列表响应类型
 */
interface PublicOrganizationsResponse {
  success: boolean;
  data: {
    data: Array<{
      id: string;
      name: string;
      description: string | null;
      created_at: string;
      updated_at: string;
      owner: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    }>;
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
 * 获取公开组织列表参数
 */
interface UsePublicOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 获取所有公开组织列表（设置了密码的组织）
 * 用于演讲者选择要加入的组织
 */
export function usePublicOrganizations(params?: UsePublicOrganizationsParams) {
  // 构建查询参数
  const searchParams = new URLSearchParams();
  if (params?.page) {
    searchParams.set('page', params.page.toString());
  }
  if (params?.limit) {
    searchParams.set('limit', params.limit.toString());
  }
  if (params?.search) {
    searchParams.set('search', params.search);
  }
  if (params?.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params?.sortOrder) {
    searchParams.set('sortOrder', params.sortOrder);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `/api/organizations/public?${queryString}`
    : '/api/organizations/public';

  const { data, error, isLoading, mutate } =
    useSWR<PublicOrganizationsResponse>(url, {
      // 30秒内不重新请求
      dedupingInterval: 30 * 1000,
      // 错误重试间隔递增
      errorRetryInterval: 1000,
      // 最多重试3次
      errorRetryCount: 3,
    });

  return {
    organizations: data?.data?.data || [],
    pagination: data?.data?.pagination,
    isLoading,
    error,
    mutate,
  };
}
