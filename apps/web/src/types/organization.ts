/**
 * 组织类型定义
 * 用于前端组件，与数据库类型略有不同
 */

import type { Organization as DBOrganization } from '@repo/db';

/**
 * 前端组织类型
 * 日期字段为 string 类型（JSON 序列化后）
 */
export interface Organization
  extends Omit<DBOrganization, 'created_at' | 'updated_at'> {
  created_at: string;
  updated_at: string;
  _count?: {
    lectures: number;
  };
}

/**
 * 组织列表项类型
 * 用于列表展示，包含统计信息
 */
export type OrganizationListItem = Organization;
