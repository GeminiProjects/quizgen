# API 路由文档

QuizGen 系统的 API 路由结构和说明文档。

## 总体架构

所有 API 路由都位于 `apps/web/src/app/api/` 目录下，基于 Next.js 15 的 App Router 架构。

### 响应格式

所有 API 响应都遵循统一的格式：

```typescript
// 成功响应
{
  success: true,
  data: any,
  message?: string
}

// 错误响应
{
  success: false,
  error: string,
  details?: any
}
```

### 身份验证

所有 API 路由都需要用户身份验证（除了 `/api/auth/` 路由）。使用 Better Auth 进行身份验证。

## 路由详情

### 1. 身份认证路由

#### `/api/auth/[...all]`
- **方法**: `GET`, `POST`
- **描述**: Better Auth 的身份认证处理路由
- **功能**: 处理 GitHub OAuth 登录、登出等认证相关操作

---

### 2. 演讲管理路由

#### `/api/lectures`
- **方法**: `POST` - 创建演讲
  - **请求体**: 
    ```typescript
    {
      title: string;
      description?: string;
      org_id?: string;
      org_password?: string;
      starts_at: string; // ISO 日期字符串
    }
    ```
  - **响应**: 创建的演讲信息（包含生成的 `join_code`）
  - **权限**: 需要登录

- **方法**: `GET` - 获取演讲列表
  - **查询参数**: 
    - `page`: 页码（默认 1）
    - `limit`: 每页数量（默认 10）
    - `org_id`: 组织 ID 过滤
    - `status`: 状态过滤 (`not_started`, `in_progress`, `ended`)
    - `search`: 搜索关键词
  - **响应**: 包含分页信息的演讲列表
  - **权限**: 只返回用户创建的演讲

#### `/api/lectures/[id]`
- **方法**: `GET` - 获取单个演讲详情
  - **权限**: 只有演讲创建者可访问

- **方法**: `PUT` - 更新演讲信息
  - **请求体**: 
    ```typescript
    {
      title?: string;
      description?: string;
      status?: 'not_started' | 'in_progress' | 'ended';
      starts_at?: string;
      ends_at?: string;
    }
    ```
  - **权限**: 只有演讲创建者可修改

- **方法**: `DELETE` - 删除演讲
  - **权限**: 只有演讲创建者可删除，进行中的演讲无法删除

#### `/api/lectures/join`
- **方法**: `POST` - 通过演讲码加入演讲
  - **请求体**: 
    ```typescript
    {
      join_code: string; // 演讲码
    }
    ```
  - **功能**: 验证演讲码格式，检查演讲状态，自动添加参与者记录
  - **权限**: 需要登录

---

### 3. 组织管理路由

#### `/api/organizations`
- **方法**: `POST` - 创建组织
  - **请求体**: 
    ```typescript
    {
      name: string;
      description?: string;
      password: string;
    }
    ```
  - **权限**: 需要登录

- **方法**: `GET` - 获取组织列表
  - **查询参数**: 
    - `page`: 页码（默认 1）
    - `limit`: 每页数量（默认 10）
    - `search`: 搜索关键词
  - **权限**: 只返回用户创建的组织

#### `/api/organizations/[id]`
- **方法**: `GET` - 获取单个组织详情
  - **权限**: 只有组织创建者可访问

- **方法**: `PUT` - 更新组织信息
  - **请求体**: 
    ```typescript
    {
      name?: string;
      description?: string;
      password?: string;
    }
    ```
  - **权限**: 只有组织创建者可修改

- **方法**: `DELETE` - 删除组织
  - **权限**: 只有组织创建者可删除

#### `/api/organizations/[id]/verify`
- **方法**: `POST` - 验证组织密码
  - **请求体**: 
    ```typescript
    {
      password: string;
    }
    ```
  - **功能**: 验证用户提供的密码是否与组织密码匹配
  - **权限**: 需要登录

---

### 4. 测验题目管理路由

#### `/api/quiz-items`
- **方法**: `POST` - 创建测验题目
  - **请求体**: 
    ```typescript
    {
      question: string;
      options: string[];
      answer: number; // 正确答案的索引
      lecture_id: string;
    }
    ```
  - **权限**: 只有演讲创建者可创建题目

- **方法**: `GET` - 获取测验题目列表
  - **查询参数**: 
    - `lecture_id`: 演讲 ID（必需）
    - `page`: 页码（默认 1）
    - `limit`: 每页数量（默认 10）
  - **权限**: 演讲创建者可查看全部信息，参与者只能查看题目和选项（不显示答案）

#### `/api/quiz-items/[id]`
- **方法**: `GET` - 获取单个题目详情
  - **权限**: 演讲创建者和参与者可访问，参与者看不到答案

- **方法**: `PUT` - 更新题目信息
  - **请求体**: 
    ```typescript
    {
      question?: string;
      options?: string[];
      answer?: number;
    }
    ```
  - **权限**: 只有演讲创建者可修改，已结束的演讲无法修改题目

- **方法**: `DELETE` - 删除题目
  - **权限**: 只有演讲创建者可删除，已结束的演讲无法删除题目

---

### 5. 答题记录管理路由

#### `/api/attempts`
- **方法**: `POST` - 提交答题记录
  - **请求体**: 
    ```typescript
    {
      quiz_id: string;
      selected: number; // 选择的答案索引
    }
    ```
  - **功能**: 
    - 验证用户是否参与该演讲
    - 检查演讲状态（只有进行中的演讲可以答题）
    - 防止重复提交
    - 自动计算正确性
  - **权限**: 需要先加入演讲

- **方法**: `GET` - 获取答题统计
  - **查询参数**: 
    - `quiz_id`: 获取单个题目的统计（可选）
    - `lecture_id`: 获取整个演讲的统计（可选）
  - **单个题目统计返回**: 
    ```typescript
    {
      quiz_id: string;
      question: string;
      options: string[];
      correct_answer: number;
      total_attempts: number;
      correct_attempts: number;
      correct_rate: number;
      average_latency: number;
      option_stats: Array<{
        option_index: number;
        count: number;
      }>;
    }
    ```
  - **演讲统计返回**: 
    ```typescript
    {
      lecture_id: string;
      lecture_title: string;
      total_questions: number;
      total_participants: number;
    }
    ```
  - **权限**: 只有演讲创建者可查看统计信息

## 错误处理

所有 API 路由都使用 `withErrorHandler` 包装器进行统一的错误处理：

- **401 Unauthorized**: 用户未登录
- **403 Forbidden**: 用户无权限访问资源
- **404 Not Found**: 请求的资源不存在
- **400 Bad Request**: 请求参数错误或业务逻辑错误
- **500 Internal Server Error**: 服务器内部错误

## 数据验证

所有 API 路由都使用 Zod 进行数据验证：

- 请求体验证：使用 `validateRequestBody` 工具函数
- 查询参数验证：使用 `validateSearchParams` 工具函数
- 数据模式定义：位于 `apps/web/src/lib/schemas/` 目录

## 权限控制

### 资源权限
- **演讲**: 只有创建者可以管理，参与者可以查看和答题
- **组织**: 只有创建者可以管理
- **测验题目**: 只有演讲创建者可以管理
- **答题记录**: 参与者可以提交，演讲创建者可以查看统计

### 状态检查
- **演讲状态**: 影响题目创建、修改和答题功能
- **参与者状态**: 需要先加入演讲才能答题

## 数据库关系

路由操作涉及的主要数据表：

- `users`: 用户表
- `organizations`: 组织表
- `lectures`: 演讲表
- `lecture_participants`: 演讲参与者表
- `quiz_items`: 测验题目表
- `attempts`: 答题记录表