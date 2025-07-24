/**
 * Web 应用统一类型定义
 * 基于数据库类型进行扩展，处理序列化后的日期字段
 */

// 由于 Comment 类型在数据库客户端中可能不存在，我们需要单独定义
import type { Comment as DBComment } from '@repo/db';
import type {
  Attempt as DBAttempt,
  Lecture as DBLecture,
  LectureParticipant as DBLectureParticipant,
  Material as DBMaterial,
  Organization as DBOrganization,
  QuizItem as DBQuizItem,
  Transcript as DBTranscript,
  User as DBUser,
} from '@repo/db/client';

// ============= 基础类型转换 =============
// 将 Date 类型转换为 string（处理 Server Actions 序列化）
export type DateToString<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
      : T[K];
};

// ============= 用户相关 =============
export interface User extends DateToString<DBUser> {
  avatar_url?: string | null;
  is_anonymous?: boolean;
}

// ============= 组织相关 =============
export interface Organization extends DateToString<DBOrganization> {
  owner?: Pick<User, 'id' | 'email' | 'name' | 'avatar_url'>;
  _count?: {
    lectures: number;
  };
}

// ============= 演讲相关 =============
export interface Lecture extends DateToString<DBLecture> {
  speaker?: Pick<User, 'id' | 'email' | 'name' | 'avatar_url'>;
  organization?: Pick<Organization, 'id' | 'name' | 'owner_id'>;
  _count?: {
    quiz_items: number;
    participants: number;
    materials: number;
    transcripts: number;
  };
}

// 演讲状态
export type LectureStatus = 'not_started' | 'in_progress' | 'paused' | 'ended';

export const lectureStatusConfig: Record<
  LectureStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
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
    variant: 'default',
    className: 'bg-success/10 text-success',
  },
  paused: {
    label: '已暂停',
    variant: 'secondary',
    className: 'bg-warning/10 text-warning',
  },
  ended: {
    label: '已结束',
    variant: 'outline',
    className: 'bg-muted text-muted-foreground',
  },
};

// ============= 材料相关 =============
/**
 * 材料类型定义
 * 继承自数据库材料类型，处理日期序列化并添加关联用户信息
 */
export interface Material extends DateToString<DBMaterial> {
  // 上传者信息（可选）
  uploader?: Pick<User, 'id' | 'email' | 'name'>;
}

/**
 * 材料状态枚举
 * - processing: 处理中（上传、解析等）
 * - completed: 处理完成，可以使用
 * - timeout: 处理超时
 *
 * 注意：失败的材料会被自动删除，不会保存在数据库中
 */
export type MaterialStatus = 'processing' | 'completed' | 'timeout';

/**
 * 材料状态配置
 * 定义每个状态的显示文本、样式和类名
 */
export const materialStatusConfig: Record<
  MaterialStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  }
> = {
  processing: {
    label: '处理中',
    variant: 'secondary',
    className: 'bg-info/10 text-info',
  },
  completed: {
    label: '已完成',
    variant: 'default',
    className: 'bg-success/10 text-success',
  },
  timeout: {
    label: '处理超时',
    variant: 'destructive',
    className: 'bg-destructive/10 text-destructive',
  },
};

// ============= 测验相关 =============
export interface QuizItem extends DateToString<DBQuizItem> {
  _count?: {
    attempts: number;
  };
  correctRate?: number;
}

export interface Attempt extends DateToString<DBAttempt> {
  user?: Pick<User, 'id' | 'email' | 'name' | 'avatar_url'>;
  quiz?: QuizItem;
}

export type ParticipationHistory = {
  attempt: Attempt;
  quizItem: QuizItem;
}[];

// ============= 参与者相关 =============
export interface LectureParticipant extends DateToString<DBLectureParticipant> {
  participant?: Pick<User, 'id' | 'email' | 'name' | 'avatar_url'>;
  lecture?: Pick<Lecture, 'id' | 'title'>;
}

// 参与者角色
export type ParticipantRole = 'speaker' | 'audience' | 'assistant';

// 参与者状态
export type ParticipantStatus = 'joined' | 'active' | 'left' | 'kicked';

// 测验答题记录
export interface QuizAttempt {
  quiz_id: string;
  selected: number;
  is_correct: boolean;
}

// 参与的演讲测验题目
export interface ParticipatedQuizItem {
  id: string;
  question: string;
  options: string[];
  answer?: number;
  ts: string;
  created_at: string;
  attempted: boolean;
  my_attempt?: QuizAttempt;
}

// 参与的演讲（包含完整信息）
export interface ParticipatedLecture {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  org_id: string | null;
  status: LectureStatus;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  owner_name: string | null;
  participant_role: ParticipantRole;
  participant_status: ParticipantStatus;
  joined_at: string;
  quizzes?: ParticipatedQuizItem[];
  _count?: {
    quiz_items: number;
  };
}

// ============= 转录相关 =============
export interface Transcript extends DateToString<DBTranscript> {}

// ============= 评论相关 =============
export interface Comment extends DateToString<DBComment> {
  user?: Pick<User, 'id' | 'email' | 'name' | 'avatar_url' | 'is_anonymous'>;
  lecture?: Pick<Lecture, 'id' | 'title'>;
}

// 评论可见性
export type CommentVisibility = 'public' | 'speaker_only';

// ============= 统计相关 =============
export interface LectureStats {
  totalParticipants: number;
  totalQuizItems: number;
  totalTranscripts: number;
  totalMaterials: number;
  contextSize: number;
  duration: string;
}

// ============= 表单相关 =============
export interface CreateOrganizationData {
  name: string;
  description?: string;
  access_code?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  description?: string;
  access_code?: string;
}

export interface CreateLectureData {
  title: string;
  description?: string;
  organization_id: string;
}

export interface UpdateLectureData {
  title?: string;
  description?: string;
}

// ============= API 响应相关 =============
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Actions 统一返回类型
 * 用于所有 Server Actions 的标准响应格式
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 分页查询结果类型
 * 包含完整的分页信息
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ============= 扩展类型 =============
// 包含测验题目数据的扩展类型
export interface QuizItemWithDate extends QuizItem {
  _count?: {
    attempts: number;
    correctAttempts: number;
  };
}

// 包含测验题目的演讲类型
export interface LectureWithQuizItems extends Lecture {
  quizItems?: QuizItemWithDate[];
}

// 带日期的演讲类型
export interface LectureWithDate {
  id: string;
  title: string;
  created_at: string | Date;
  description?: string | null;
  status?: string;
  participantCount?: number;
}

// 包含演讲列表的组织类型
export interface OrganizationWithLectures extends Organization {
  lectures?: LectureWithDate[];
}

// 演讲详情客户端属性
export interface LectureDetailClientProps {
  lecture: LectureWithQuizItems;
  stats: {
    totalParticipants: number;
    totalQuizItems: number;
    totalTranscripts: number;
    totalMaterials: number;
    contextSize: number;
    avgResponseTime: number;
  };
}

// 组织详情客户端属性
export interface OrganizationDetailClientProps {
  organization: OrganizationWithLectures;
  stats: {
    totalLectures: number;
  };
}

// 参与演讲数据结构
export interface LectureData {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'paused' | 'ended';
  starts_at: string;
  ends_at: string | null;
  owner_name: string;
  quizzes: QuizItem[];
}

// ============= 数据库常量 =============
// 从 @repo/db/client 导入以避免服务器端代码泄露到客户端
