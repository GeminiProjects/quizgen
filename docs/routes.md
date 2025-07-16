# QuizGen API 路由设计

## 概述

QuizGen 后端 API 基于 Next.js App Router 构建，使用 RESTful 风格设计。所有路由都位于 `/apps/web/src/app/api` 目录下。

## 认证策略

- 使用 Better Auth 提供的认证机制
- 大部分 API 需要用户登录（除了公开的组织信息查询）
- 通过 session 验证用户身份和权限

## API 路由规划

### 1. 认证相关 `/api/auth/[...all]`
- 由 Better Auth 自动处理
- 包含登录、注册、登出等功能

### 2. 组织管理 `/api/organizations`
- `GET /api/organizations` - 获取组织列表（支持分页、搜索）
- `POST /api/organizations` - 创建新组织（需要登录）
- `GET /api/organizations/[id]` - 获取组织详情
- `PATCH /api/organizations/[id]` - 更新组织信息（仅创建者）
- `DELETE /api/organizations/[id]` - 删除组织（仅创建者）
- `POST /api/organizations/[id]/verify` - 验证组织密码

### 3. 演讲管理 `/api/lectures`
- `GET /api/lectures` - 获取演讲列表（支持按组织、用户筛选）
- `POST /api/lectures` - 创建新演讲（需要组织密码）
- `GET /api/lectures/[id]` - 获取演讲详情
- `PATCH /api/lectures/[id]` - 更新演讲信息（仅创建者）
- `DELETE /api/lectures/[id]` - 删除演讲（仅创建者）
- `POST /api/lectures/[id]/end` - 结束演讲（仅创建者）

### 4. 材料管理 `/api/lectures/[id]/materials`
- `GET /api/lectures/[id]/materials` - 获取演讲材料列表
- `POST /api/lectures/[id]/materials` - 上传新材料（仅演讲创建者）
- `DELETE /api/lectures/[id]/materials/[materialId]` - 删除材料

### 5. 转录文本 `/api/lectures/[id]/transcripts`
- `GET /api/lectures/[id]/transcripts` - 获取转录历史
- `POST /api/lectures/[id]/transcripts` - 提交新转录（仅演讲进行中）
- `GET /api/lectures/[id]/transcripts/stream` - SSE 实时转录流

### 6. 测验题目 `/api/lectures/[id]/quiz`
- `GET /api/lectures/[id]/quiz` - 获取演讲的所有题目
- `POST /api/lectures/[id]/quiz` - 生成新题目（基于转录/材料）
- `GET /api/lectures/[id]/quiz/[quizId]` - 获取单个题目详情

### 7. 答题记录 `/api/quiz/[id]/attempts`
- `POST /api/quiz/[id]/attempts` - 提交答题（听众）
- `GET /api/quiz/[id]/attempts/stats` - 获取题目统计

### 8. 用户相关 `/api/users`
- `GET /api/users/me` - 获取当前用户信息
- `PATCH /api/users/me` - 更新用户信息
- `GET /api/users/me/stats` - 获取用户统计（作为演讲者/听众）

### 9. 统计分析 `/api/analytics`
- `GET /api/analytics/lectures/[id]` - 获取演讲分析数据
- `GET /api/analytics/organizations/[id]` - 获取组织统计

## 测试策略

### 1. 测试环境设置

使用 PGLite 在内存中模拟 PostgreSQL 数据库，避免依赖外部数据库。

```typescript
// tests/setup.ts
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@packages/db/schema';

export const createTestDB = async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema, casing: 'snake_case' });
  // 初始化数据库结构
  await initializeSchema(db);
  return { db, client };
};
```

### 2. 测试工具函数

```typescript
// tests/helpers.ts
// 创建测试用户
export const createTestUser = async (db: DB) => { ... };

// 创建认证 headers
export const createAuthHeaders = (userId: string) => { ... };

// 模拟 Next.js 请求
export const createMockRequest = (options: RequestOptions) => { ... };
```

### 3. 测试示例结构

```typescript
// api/organizations/route.test.ts
describe('Organizations API', () => {
  let db: DB;
  let testUser: User;
  
  beforeEach(async () => {
    ({ db } = await createTestDB());
    testUser = await createTestUser(db);
  });
  
  describe('GET /api/organizations', () => {
    test('应该返回组织列表', async () => {
      // 准备测试数据
      // 调用 API
      // 验证响应
    });
  });
  
  describe('POST /api/organizations', () => {
    test('需要登录才能创建组织', async () => { ... });
    test('成功创建组织', async () => { ... });
    test('验证必填字段', async () => { ... });
  });
});
```

## 错误处理

### 标准错误响应格式

```typescript
{
  error: {
    code: 'ERROR_CODE',
    message: '用户友好的错误信息',
    details?: any // 可选的详细信息
  }
}
```

### 常见错误码

- `UNAUTHORIZED` - 401: 未登录
- `FORBIDDEN` - 403: 无权限
- `NOT_FOUND` - 404: 资源不存在
- `VALIDATION_ERROR` - 400: 请求参数错误
- `INTERNAL_ERROR` - 500: 服务器内部错误

## 性能优化建议

1. **分页**: 列表接口默认限制返回数量
2. **缓存**: 对频繁访问的数据使用适当缓存
3. **查询优化**: 使用 Drizzle 的关系查询减少 N+1 问题
4. **并发控制**: 对写操作使用事务保证数据一致性
