// 用户类型
export interface User {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  created_at: Date;
}

// 讲座类型
export interface Lecture {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  owner: User;
  starts_at: Date;
  ends_at?: Date;
  status: 'pending' | 'active' | 'completed';
  participants_count: number;
  created_at: Date;
}

// 材料类型
export interface Material {
  id: string;
  lecture_id: string;
  title: string;
  text_content: string;
  file_type: 'pdf' | 'ppt' | 'text' | 'doc';
  uploaded_at: Date;
}

// 转录类型
export interface Transcript {
  id: string;
  lecture_id: string;
  ts: Date;
  text: string;
  speaker_id?: string;
}

// 题目类型
export interface QuizItem {
  id: string;
  lecture_id: string;
  question: string;
  options: string[]; // 固定 4 个选项
  answer: number; // 正确答案索引 (0-3)
  ts: Date;
  time_limit: number; // 答题时间限制（秒）
  is_active: boolean;
  created_at: Date;
}

// 答题记录类型
export interface Attempt {
  quiz_id: string;
  user_id: string;
  user: User;
  selected: number; // 用户选择的答案索引
  is_correct: boolean;
  latency_ms: number; // 答题延迟（毫秒）
  answered_at: Date;
}

// 题目统计类型
export interface QuizStats {
  quiz_id: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  average_latency: number;
  option_distribution: number[]; // 每个选项的选择人数
}

// 讲座统计类型
export interface LectureStats {
  lecture_id: string;
  total_participants: number;
  total_questions: number;
  overall_accuracy: number;
  engagement_rate: number;
  quiz_stats: QuizStats[];
}

// 用户角色类型
export type UserRole = 'speaker' | 'audience';

// 答题状态类型
export type QuizStatus = 'waiting' | 'active' | 'submitted' | 'expired';
