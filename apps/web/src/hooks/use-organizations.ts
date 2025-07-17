import useSWR from 'swr';
import type { Organization } from '@/types/organization';

/**
 * 组织列表响应类型
 */
interface OrganizationsResponse {
  success: boolean;
  data: {
    data: Organization[];
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
 * 获取用户的组织列表
 */
export function useOrganizations() {
  const { data, error, isLoading, mutate } = useSWR<OrganizationsResponse>(
    '/api/organizations',
    {
      // 5分钟内不重新请求
      dedupingInterval: 5 * 60 * 1000,
      // 错误重试间隔递增
      errorRetryInterval: 1000,
      // 最多重试3次
      errorRetryCount: 3,
    }
  );

  return {
    organizations: data?.data?.data || [],
    pagination: data?.data?.pagination,
    isLoading,
    error,
    mutate,
  };
}

/**
 * 获取单个组织详情
 */
export function useOrganization(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Organization>(
    id ? `/api/organizations/${id}` : null,
    {
      // 组织详情缓存时间更长
      dedupingInterval: 10 * 60 * 1000,
    }
  );

  return {
    organization: data,
    isLoading,
    error,
    mutate,
  };
}

/**
 * 组织操作 hooks
 */
export function useOrganizationActions() {
  const { mutate: mutateList } = useOrganizations();

  /**
   * 创建组织
   */
  const createOrganization = async (data: {
    name: string;
    description?: string;
  }) => {
    const response = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('创建组织失败');
    }

    const result = await response.json();

    // 乐观更新列表
    await mutateList();

    return result;
  };

  /**
   * 更新组织
   */
  const updateOrganization = async (
    id: string,
    data: { name?: string; description?: string }
  ) => {
    const response = await fetch(`/api/organizations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('更新组织失败');
    }

    const result = await response.json();

    // 更新列表缓存
    await mutateList();

    return result;
  };

  /**
   * 删除组织
   */
  const deleteOrganization = async (id: string) => {
    const response = await fetch(`/api/organizations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('删除组织失败');
    }

    // 更新列表缓存
    await mutateList();
  };

  /**
   * 验证邀请码
   */
  const verifyInvitationCode = async (id: string, code: string) => {
    const response = await fetch(`/api/organizations/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('验证失败');
    }

    return response.json();
  };

  return {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    verifyInvitationCode,
  };
}
