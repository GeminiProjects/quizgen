# QuizGen API 文档

## 目录

1. [概述](#概述)
2. [认证](#认证)
3. [Server Actions API](#server-actions-api)
   - [演讲管理](#演讲管理)
   - [组织管理](#组织管理)
   - [测验管理](#测验管理)
   - [材料管理](#材料管理)
   - [参与互动](#参与互动)
4. [数据类型](#数据类型)
5. [错误处理](#错误处理)
6. [最佳实践](#最佳实践)

## 概述

QuizGen 采用 Next.js 15 的 Server Actions 作为主要的数据交互方式。Server Actions 提供了类型安全、自动序列化和内置的错误处理机制。

### 为什么选择 Server Actions

- **类型安全**：端到端的 TypeScript 支持
- **简化开发**：无需手动处理 API 路由和请求
- **更好的性能**：自动优化和批处理
- **内置安全**：CSRF 保护和自动验证

### 基本使用方式

```typescript
// 客户端组件中调用
import { createLecture } from '@/app/actions/lectures';

const handleSubmit = async (data: CreateLectureData) => {
  const result = await createLecture(data);
  
  if (result.success) {
    console.log('演讲创建成功:', result.data);
  } else {
    console.error('创建失败:', result.error);
  }
};
```

## 认证

所有需要身份验证的 Server Actions 都会在内部调用 `requireAuth()` 函数。如果用户未登录，将返回错误。

```typescript
// 认证错误响应示例
{
  success: false,
  error: "请先登录"
}
```

## Server Actions API

### 演讲管理

#### getLectures

获取用户的演讲列表，支持分页、筛选和搜索。

```typescript
async function getLectures(params?: {
  page?: number;      // 页码，默认 1
  limit?: number;     // 每页数量，默认 50
  org_id?: string;    // 组织 ID（可选）
  status?: LectureStatus; // 演讲状态（可选）
  search?: string;    // 搜索关键词（可选）
}): Promise<ActionResult<PaginatedResult<Lecture>>>
```

**示例响应**：
```typescript
{
  success: true,
  data: {
    data: [
      {
        id: "uuid",
        title: "React 性能优化",
        description: "深入讲解 React 性能优化技巧",
        owner_id: "user_id",
        org_id: "org_id",
        join_code: "ABC123",
        status: "not_started",
        starts_at: "2024-01-20T10:00:00Z",
        ends_at: null,
        created_at: "2024-01-15T08:00:00Z",
        updated_at: "2024-01-15T08:00:00Z",
        _count: {
          quiz_items: 5,
          participants: 30,
          materials: 2,
          transcripts: 1
        }
      }
    ],
    total: 10,
    page: 1,
    limit: 50,
    totalPages: 1,
    hasMore: false
  }
}
```

#### createLecture

创建新的演讲。

```typescript
async function createLecture(input: {
  title: string;              // 演讲标题
  description?: string;       // 演讲描述（可选）
  organization_id?: string;   // 组织 ID（可选）
}): Promise<ActionResult<Lecture>>
```

**示例请求**：
```typescript
const result = await createLecture({
  title: "TypeScript 高级特性",
  description: "深入探讨 TypeScript 的高级类型系统",
  organization_id: "org_123"
});
```

#### updateLecture

更新演讲信息。

```typescript
async function updateLecture(
  id: string,
  input: {
    title?: string;
    description?: string;
  }
): Promise<ActionResult<Lecture>>
```

#### updateLectureStatus

更新演讲状态（开始、暂停、结束等）。

```typescript
async function updateLectureStatus(
  id: string,
  status: LectureStatus
): Promise<ActionResult<Lecture>>
```

**状态值**：
- `not_started`: 未开始
- `in_progress`: 进行中
- `paused`: 已暂停
- `ended`: 已结束

#### deleteLecture

删除演讲（软删除）。

```typescript
async function deleteLecture(id: string): Promise<ActionResult<boolean>>
```

### 组织管理

#### getOrganizations

获取用户创建的组织列表。

```typescript
async function getOrganizations(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ActionResult<PaginatedResult<Organization>>>
```

#### createOrganization

创建新组织。

```typescript
async function createOrganization(input: {
  name: string;         // 组织名称
  description?: string; // 组织描述
  password?: string;    // 加入密码
}): Promise<ActionResult<Organization>>
```

#### updateOrganization

更新组织信息。

```typescript
async function updateOrganization(
  id: string,
  input: {
    name?: string;
    description?: string;
    password?: string;
  }
): Promise<ActionResult<Organization>>
```

#### deleteOrganization

删除组织。

```typescript
async function deleteOrganization(id: string): Promise<ActionResult<boolean>>
```

### 测验管理

#### getQuizItems

获取演讲的所有测验题目。

```typescript
async function getQuizItems(lectureId: string): Promise<
  ActionResult<Array<QuizItem & {
    _count: {
      attempts: number;
      correctAttempts: number;
    };
  }>>
>
```

#### generateQuiz

基于演讲内容生成测验题目。

```typescript
async function generateQuiz(input: {
  lecture_id: string;     // 演讲 ID
  context: string;        // 上下文内容
  count?: number;         // 生成题目数量，默认 1
  difficulty?: 'easy' | 'medium' | 'hard'; // 难度
}): Promise<ActionResult<QuizItem[]>>
```

**示例请求**：
```typescript
const result = await generateQuiz({
  lecture_id: "lecture_123",
  context: "React Hooks 允许你在不编写 class 的情况下使用 state...",
  count: 3,
  difficulty: 'medium'
});
```

#### deleteQuizItem

删除测验题目。

```typescript
async function deleteQuizItem(id: string): Promise<ActionResult<boolean>>
```

### 材料管理

#### getMaterials

获取演讲的材料列表。

```typescript
async function getMaterials(lectureId: string): Promise<
  ActionResult<Material[]>
>
```

#### uploadMaterial

上传演讲材料。

```typescript
async function uploadMaterial(input: {
  lecture_id: string;
  name: string;
  type: 'document' | 'slides' | 'video' | 'audio';
  url: string;
  size: number;
  metadata?: Record<string, unknown>;
}): Promise<ActionResult<Material>>
```

#### deleteMaterial

删除材料。

```typescript
async function deleteMaterial(id: string): Promise<ActionResult<boolean>>
```

### 参与互动

#### joinLecture

加入演讲（通过邀请码）。

```typescript
async function joinLecture(
  joinCode: string
): Promise<ActionResult<{
  lecture: Lecture;
  participant: LectureParticipant;
}>>
```

#### leaveLecture

离开演讲。

```typescript
async function leaveLecture(
  lectureId: string
): Promise<ActionResult<boolean>>
```

#### submitAnswer

提交测验答案。

```typescript
async function submitAnswer(input: {
  quiz_id: string;      // 题目 ID
  selected: number;     // 选择的答案（0-3）
  start_time: number;   // 开始答题时间戳
}): Promise<ActionResult<{
  is_correct: boolean;
  correct_answer: number;
}>>
```

**示例请求**：
```typescript
const startTime = Date.now();
// 用户选择答案
const result = await submitAnswer({
  quiz_id: "quiz_123",
  selected: 2,
  start_time: startTime
});

if (result.success) {
  console.log('答案是否正确:', result.data.is_correct);
  console.log('正确答案是:', result.data.correct_answer);
}
```

#### getParticipationHistory

获取用户的参与历史。

```typescript
async function getParticipationHistory(params?: {
  page?: number;
  limit?: number;
}): Promise<ActionResult<PaginatedResult<ParticipatedLecture>>>
```

## 数据类型

### 基础类型

```typescript
// 演讲状态
type LectureStatus = 'not_started' | 'in_progress' | 'paused' | 'ended';

// 参与者角色
type ParticipantRole = 'speaker' | 'audience' | 'assistant';

// 参与者状态
type ParticipantStatus = 'joined' | 'active' | 'left' | 'kicked';

// 材料类型
type MaterialType = 'document' | 'slides' | 'video' | 'audio';
```

### 响应类型

```typescript
// 统一的 Action 响应类型
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// 分页响应
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
```

### 实体类型

```typescript
// 用户
interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// 组织
interface Organization {
  id: string;
  name: string;
  description: string | null;
  password: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner?: User;
  _count?: {
    lectures: number;
  };
}

// 演讲
interface Lecture {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  org_id: string | null;
  join_code: string;
  status: LectureStatus;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  speaker?: User;
  organization?: Organization;
  _count?: {
    quiz_items: number;
    participants: number;
    materials: number;
    transcripts: number;
  };
}

// 测验题目
interface QuizItem {
  id: string;
  lecture_id: string;
  question: string;
  options: string[];
  answer: number;
  ts: string;
  created_at: string;
  _count?: {
    attempts: number;
  };
  correctRate?: number;
}

// 答题记录
interface Attempt {
  quiz_id: string;
  user_id: string;
  selected: number;
  is_correct: boolean;
  latency_ms: number;
  created_at: string;
}
```

## 错误处理

### 错误响应格式

所有错误都遵循统一的格式：

```typescript
{
  success: false,
  error: "错误描述信息"
}
```

### 常见错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| "请先登录" | 用户未认证 | 引导用户登录 |
| "无权访问此资源" | 权限不足 | 检查用户角色和权限 |
| "资源不存在" | ID 无效或已删除 | 检查资源 ID |
| "参数验证失败" | 输入数据不符合要求 | 检查输入格式 |
| "操作失败" | 服务器内部错误 | 重试或联系支持 |

### 错误处理示例

```typescript
// 组件中的错误处理
const handleCreateLecture = async (data: CreateLectureData) => {
  try {
    const result = await createLecture(data);
    
    if (result.success) {
      toast.success('演讲创建成功');
      router.push(`/lectures/${result.data.id}`);
    } else {
      // 处理业务错误
      toast.error(result.error);
    }
  } catch (error) {
    // 处理网络或其他异常
    console.error('创建演讲失败:', error);
    toast.error('网络错误，请稍后重试');
  }
};
```

## 最佳实践

### 1. 使用 TypeScript

充分利用 TypeScript 的类型系统：

```typescript
import type { Lecture } from '@/types';
import { createLecture } from '@/app/actions/lectures';

// 类型会自动推导
const result = await createLecture({
  title: "演讲标题",
  // TypeScript 会提示可用的字段
});
```

### 2. 错误边界

在组件树中使用错误边界捕获异常：

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <LectureList />
</ErrorBoundary>
```

### 3. 加载状态

使用 React 的 Suspense 处理加载状态：

```typescript
<Suspense fallback={<LoadingSkeleton />}>
  <LectureDetails lectureId={id} />
</Suspense>
```

### 4. 乐观更新

对于用户体验要求高的操作，使用乐观更新：

```typescript
const [optimisticLectures, setOptimisticLectures] = useState(lectures);

const handleStatusUpdate = async (id: string, status: LectureStatus) => {
  // 乐观更新 UI
  setOptimisticLectures(prev => 
    prev.map(l => l.id === id ? { ...l, status } : l)
  );
  
  // 执行实际更新
  const result = await updateLectureStatus(id, status);
  
  if (!result.success) {
    // 回滚乐观更新
    setOptimisticLectures(lectures);
    toast.error(result.error);
  }
};
```

### 5. 缓存策略

使用 Next.js 的缓存机制优化性能：

```typescript
// Server Actions 会自动处理缓存
// 使用 revalidatePath 或 revalidateTag 更新缓存
import { revalidatePath } from 'next/cache';

export async function createLecture(input: CreateLectureInput) {
  // ... 创建演讲
  
  // 更新相关页面的缓存
  revalidatePath('/lectures');
  revalidatePath('/dashboard');
  
  return result;
}
```

### 6. 批量操作

对于批量操作，使用事务保证数据一致性：

```typescript
export async function batchDeleteQuizItems(ids: string[]) {
  return await db.transaction(async (tx) => {
    for (const id of ids) {
      await tx.delete(quizItems).where(eq(quizItems.id, id));
    }
  });
}
```

## 总结

QuizGen 的 API 设计遵循了 Next.js 15 的最佳实践，通过 Server Actions 提供了类型安全、高性能的数据交互方式。统一的错误处理和响应格式使得客户端开发更加简单和一致。