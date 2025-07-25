# QuizGen API 文档

## 目录

- [概述](#概述)
- [认证](#认证)
- [Server Actions](#server-actions)
  - [演讲管理](#演讲管理)
  - [组织管理](#组织管理)
  - [测验管理](#测验管理)
  - [材料管理](#材料管理)
  - [参与互动](#参与互动)
  - [评论系统](#评论系统)
  - [数据分析](#数据分析)
- [响应格式](#响应格式)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

## 概述

QuizGen 使用 Next.js 15 Server Actions 作为主要的数据交互方式，提供类型安全、自动序列化的 API 接口。

### 核心优势

- **类型安全** - 端到端 TypeScript 类型推导
- **零配置** - 无需手动定义 API 路由
- **内置安全** - CSRF 保护和自动验证
- **优化性能** - 自动批处理和缓存

### 基本用法

```typescript
// 客户端调用
import { createLecture } from '@/app/actions/lectures';

const result = await createLecture({
  title: "演讲标题",
  description: "演讲描述"
});

if (result.success) {
  console.log('创建成功:', result.data);
} else {
  console.error('创建失败:', result.error);
}
```

## 认证

所有需要身份验证的 Server Actions 内部调用 `requireAuth()` 函数验证用户身份。

```typescript
// 认证失败响应
{
  success: false,
  error: "请先登录"
}
```

## Server Actions

### 演讲管理

#### getLectures
获取演讲列表，支持分页、筛选和搜索。

```typescript
getLectures(params?: {
  page?: number;       // 页码，默认 1
  limit?: number;      // 每页数量，默认 50
  org_id?: string;     // 组织 ID 筛选
  status?: LectureStatus; // 状态筛选
  search?: string;     // 搜索关键词
}): Promise<ActionResult<PaginatedResult<Lecture>>>
```

#### getLecture
获取单个演讲详情。

```typescript
getLecture(id: string): Promise<ActionResult<Lecture>>
```

#### createLecture
创建新演讲。

```typescript
createLecture(input: {
  title: string;
  description?: string;
  organization_id?: string;
}): Promise<ActionResult<Lecture>>
```

#### updateLecture
更新演讲信息。

```typescript
updateLecture(id: string, input: {
  title?: string;
  description?: string;
}): Promise<ActionResult<Lecture>>
```

#### updateLectureStatus
更新演讲状态。

```typescript
updateLectureStatus(
  id: string,
  status: 'not_started' | 'in_progress' | 'paused' | 'ended'
): Promise<ActionResult<Lecture>>
```

#### deleteLecture
删除演讲。

```typescript
deleteLecture(id: string): Promise<ActionResult<boolean>>
```

#### regenerateLectureCode
重新生成演讲加入码。

```typescript
regenerateLectureCode(id: string): Promise<ActionResult<string>>
```

### 组织管理

#### getOrganizations
获取组织列表。

```typescript
getOrganizations(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ActionResult<PaginatedResult<Organization>>>
```

#### getOrganization
获取单个组织详情。

```typescript
getOrganization(id: string): Promise<ActionResult<Organization>>
```

#### createOrganization
创建组织。

```typescript
createOrganization(input: {
  name: string;
  description?: string;
  access_code?: string;
}): Promise<ActionResult<Organization>>
```

#### updateOrganization
更新组织信息。

```typescript
updateOrganization(id: string, input: {
  name?: string;
  description?: string;
  access_code?: string;
}): Promise<ActionResult<Organization>>
```

#### deleteOrganization
删除组织。

```typescript
deleteOrganization(id: string): Promise<ActionResult<boolean>>
```

#### verifyOrganizationAccessCode
验证组织访问密码。

```typescript
verifyOrganizationAccessCode(
  orgId: string,
  accessCode: string
): Promise<ActionResult<boolean>>
```

### 测验管理

#### getQuizItems
获取演讲的测验题目。

```typescript
getQuizItems(lectureId: string): Promise<ActionResult<
  Array<QuizItem & {
    _count: {
      attempts: number;
      correctAttempts: number;
    };
  }>
>>
```

#### generateQuiz
基于内容生成测验题目。

```typescript
generateQuiz(input: {
  lecture_id: string;
  context: string;
  count?: number;  // 默认 1
}): Promise<ActionResult<QuizItem[]>>
```

#### pushQuizItem
推送题目给参与者。

```typescript
pushQuizItem(quizId: string): Promise<ActionResult<QuizItem>>
```

#### deleteQuizItem
删除测验题目。

```typescript
deleteQuizItem(id: string): Promise<ActionResult<boolean>>
```

### 材料管理

#### getMaterials
获取演讲材料列表。

```typescript
getMaterials(lectureId: string): Promise<ActionResult<Material[]>>
```

#### createMaterial
创建材料记录。

```typescript
createMaterial(input: {
  lecture_id: string;
  file_name: string;
  file_type: string;
  text_content?: string;
}): Promise<ActionResult<Material>>
```

#### updateMaterialStatus
更新材料处理状态。

```typescript
updateMaterialStatus(
  id: string,
  status: 'processing' | 'completed' | 'timeout',
  error?: string
): Promise<ActionResult<Material>>
```

#### deleteMaterial
删除材料。

```typescript
deleteMaterial(id: string): Promise<ActionResult<boolean>>
```

### 参与互动

#### joinLectureByCode
使用加入码参与演讲。

```typescript
joinLectureByCode(
  code: string,
  nickname?: string
): Promise<ActionResult<{
  lecture: Lecture;
  participant: LectureParticipant;
}>>
```

#### getParticipatedLectures
获取参与的演讲列表。

```typescript
getParticipatedLectures(params?: {
  status?: 'active' | 'completed';
  page?: number;
  limit?: number;
}): Promise<ActionResult<ParticipatedLecture[]>>
```

#### getLatestQuiz
获取最新推送的题目。

```typescript
getLatestQuiz(
  lectureId: string,
  lastQuizId?: string
): Promise<ActionResult<QuizItem | null>>
```

#### submitAnswer
提交答案。

```typescript
submitAnswer(input: {
  quiz_id: string;
  selected: number;
  latency_ms?: number;
}): Promise<ActionResult<{
  is_correct: boolean;
  correct_answer: number;
  explanation?: string;
}>>
```

#### getMyAttempts
获取个人答题记录。

```typescript
getMyAttempts(
  lectureId: string
): Promise<ActionResult<Attempt[]>>
```

### 评论系统

#### getComments
获取演讲评论列表。

```typescript
getComments(params: {
  lecture_id: string;
  visibility?: 'all' | 'public' | 'speaker_only';
  limit?: number;
  offset?: number;
}): Promise<ActionResponse<{
  comments: Comment[];
  total: number;
  has_more: boolean;
}>>
```

#### createComment
发表评论。

```typescript
createComment(data: {
  lecture_id: string;
  content: string;
  is_anonymous?: boolean;
  visibility?: 'public' | 'speaker_only';
}): Promise<ActionResponse<Comment>>
```

#### updateComment
更新评论。

```typescript
updateComment(data: {
  comment_id: string;
  content?: string;
  visibility?: 'public' | 'speaker_only';
}): Promise<ActionResponse<Comment>>
```

#### deleteComment
删除评论。

```typescript
deleteComment(
  comment_id: string
): Promise<ActionResponse<boolean>>
```

### 数据分析

#### getQuizAnalytics
获取测验题目分析数据。

```typescript
getQuizAnalytics(
  quizId: string
): Promise<ActionResult<{
  quiz: QuizItem;
  stats: {
    totalAttempts: number;
    correctCount: number;
    correctRate: number;
    averageLatency: number;
    optionDistribution: Array<{
      option: number;
      count: number;
      percentage: number;
    }>;
  };
}>>
```

#### getLectureAnalytics
获取演讲统计数据。

```typescript
getLectureAnalytics(
  lectureId: string
): Promise<ActionResult<{
  participantCount: number;
  quizCount: number;
  averageCorrectRate: number;
  engagementRate: number;
  timeDistribution: Array<{
    time: string;
    count: number;
  }>;
}>>
```

## 响应格式

### 统一响应类型

```typescript
// 成功响应
type SuccessResult<T> = {
  success: true;
  data: T;
}

// 错误响应
type ErrorResult = {
  success: false;
  error: string;
}

// 联合类型
type ActionResult<T> = SuccessResult<T> | ErrorResult;
```

### 分页响应

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
```

### 示例响应

```typescript
// 成功响应示例
{
  success: true,
  data: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "React 性能优化",
    status: "in_progress",
    join_code: "ABC123"
  }
}

// 错误响应示例
{
  success: false,
  error: "无权访问此资源"
}
```

## 错误处理

### 常见错误

| 错误码            | 错误信息       | 说明               |
| ----------------- | -------------- | ------------------ |
| AUTH_REQUIRED     | 请先登录       | 需要用户认证       |
| PERMISSION_DENIED | 无权访问此资源 | 权限不足           |
| NOT_FOUND         | 资源不存在     | 资源已删除或ID无效 |
| VALIDATION_ERROR  | 参数验证失败   | 输入数据格式错误   |
| DUPLICATE_ENTRY   | 资源已存在     | 唯一性约束冲突     |
| OPERATION_FAILED  | 操作失败       | 服务器内部错误     |

### 错误处理示例

```typescript
// 组件中的错误处理
const handleSubmit = async (data: FormData) => {
  try {
    const result = await createLecture(data);
    
    if (result.success) {
      toast.success('创建成功');
      router.push(`/lectures/${result.data.id}`);
    } else {
      // 业务错误
      switch (result.error) {
        case '请先登录':
          router.push('/login');
          break;
        case '参数验证失败':
          toast.error('请检查输入内容');
          break;
        default:
          toast.error(result.error);
      }
    }
  } catch (error) {
    // 网络或系统错误
    console.error('系统错误:', error);
    toast.error('网络连接失败，请稍后重试');
  }
};
```

## 最佳实践

### 1. 类型导入

```typescript
// 使用类型导入优化打包体积
import type { Lecture, ActionResult } from '@/types';
import { createLecture } from '@/app/actions/lectures';
```

### 2. 错误边界

```typescript
// 使用错误边界捕获组件错误
<ErrorBoundary fallback={<ErrorFallback />}>
  <LectureList />
</ErrorBoundary>
```

### 3. 乐观更新

```typescript
// 提升用户体验的乐观更新
const [optimisticStatus, setOptimisticStatus] = useState(lecture.status);

const handleStatusChange = async (newStatus: LectureStatus) => {
  // 乐观更新 UI
  setOptimisticStatus(newStatus);
  
  const result = await updateLectureStatus(lecture.id, newStatus);
  
  if (!result.success) {
    // 回滚
    setOptimisticStatus(lecture.status);
    toast.error(result.error);
  }
};
```

### 4. 防抖处理

```typescript
// 搜索等场景使用防抖
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  async (keyword: string) => {
    const result = await getLectures({ search: keyword });
    if (result.success) {
      setLectures(result.data.data);
    }
  },
  500
);
```

### 5. 并发控制

```typescript
// 批量操作时控制并发
const batchDelete = async (ids: string[]) => {
  const chunks = chunk(ids, 10); // 每批10个
  
  for (const batch of chunks) {
    await Promise.all(
      batch.map(id => deleteQuizItem(id))
    );
  }
};
```

### 6. 缓存策略

```typescript
// Server Action 中的缓存更新
export async function createLecture(input: CreateLectureInput) {
  const result = await db.insert(lectures).values(input);
  
  // 更新相关路径缓存
  revalidatePath('/lectures');
  revalidatePath('/dashboard');
  
  return { success: true, data: result };
}
```

---

> QuizGen API 通过 Server Actions 提供了简洁、类型安全的数据交互方式，让开发者专注于业务逻辑而非 API 细节。