/**
 * 演讲类型定义
 * 用于前端组件，与数据库类型略有不同
 */

import type { Lecture as DBLecture } from '@repo/db';

/**
 * 前端演讲类型
 * 日期字段为 string 类型（JSON 序列化后）
 */
export interface Lecture
  extends Omit<
    DBLecture,
    'created_at' | 'updated_at' | 'starts_at' | 'ends_at'
  > {
  created_at: string;
  updated_at: string;
  starts_at: string;
  ends_at: string | null;
  speaker?: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
  };
  organization?: {
    id: string;
    name: string;
    owner_id: string;
  };
  _count?: {
    quiz_items: number;
    participants: number;
  };
}

/**
 * 演讲列表项类型
 * 用于列表展示，包含统计信息
 */
export type LectureListItem = Lecture;

/**
 * 演讲状态类型
 */
export type LectureStatus = 'not_started' | 'in_progress' | 'paused' | 'ended';

/**
 * 演讲状态显示配置
 */
export const lectureStatusConfig: Record<
  LectureStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'success' | 'warning';
    className: string;
  }
> = {
  not_started: {
    label: '未开始',
    variant: 'secondary',
    className: 'bg-secondary/10 text-secondary-foreground',
  },
  in_progress: {
    label: '进行中',
    variant: 'success',
    className: 'bg-success/10 text-success',
  },
  paused: {
    label: '已暂停',
    variant: 'warning',
    className: 'bg-warning/10 text-warning',
  },
  ended: {
    label: '已结束',
    variant: 'default',
    className: 'bg-muted text-muted-foreground',
  },
};
