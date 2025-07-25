# QuizGen 开发指南

## 目录

- [环境搭建](#环境搭建)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [组件开发](#组件开发)
- [Server Actions](#server-actions)
- [数据库操作](#数据库操作)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)

## 环境搭建

### 系统要求

- **Bun** 1.2.19+（包管理器 + 运行时）
- **Git** 2.0+
- **Docker** 20.0+（可选，用于本地数据库）

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/GeminiProjects/quizgen.git
cd quizgen

# 2. 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 3. 安装依赖
bun install --no-cache

# 4. 环境配置（交互式向导）
bun setup

# 5. 启动开发服务器
bun dev
```

### 环境变量

```env
# 必需
DATABASE_URL="postgresql://..."
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."
BETTER_AUTH_SECRET="32位随机字符串"

# 可选
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

### 本地数据库

```bash
# 使用 Docker 启动 PostgreSQL 17
bun db:start

# 推送数据库架构
bun db:push

# 打开管理界面
bun db:studio
```

## 项目结构

```
quizgen/
├── apps/web/                    # Next.js 15 应用
│   ├── src/
│   │   ├── app/                # App Router
│   │   │   ├── (dashboard)/    # 业务模块
│   │   │   ├── actions/        # Server Actions
│   │   │   └── api/           # API 路由（特殊用途）
│   │   ├── components/        # React 组件
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── lib/             # 工具函数
│   │   └── types.ts         # 统一类型定义
│   └── public/              # 静态资源
│
├── packages/
│   ├── ai/                  # AI 功能封装
│   ├── auth/               # Better Auth 配置
│   ├── db/                 # Drizzle ORM
│   └── ui/                 # shadcn/ui 组件
│
└── docs/                    # 项目文档
```

## 开发流程

### 常用命令

```bash
# 开发
bun dev                 # 启动开发服务器

# 代码质量
bun check              # TypeScript + Biome 检查
bun format             # 格式化代码

# 数据库
bun db:push            # 推送架构变更
bun db:generate        # 生成迁移文件
bun db:studio          # 数据库管理界面

# 构建
bun build              # 构建所有包
bun start              # 启动生产服务器
```

### Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/功能名称

# 2. 开发并提交
git add .
git commit -m "feat: 添加新功能"

# 3. 推送并创建 PR
git push origin feature/功能名称
```

## 代码规范

### TypeScript 约定

```typescript
// ✅ 正确：使用 import type
import type { User } from '@/types';

// ❌ 错误：禁止使用 any
const data: any = fetchData();

// ✅ 正确：使用 unknown
const data: unknown = fetchData();

// ✅ 正确：接口命名
interface ComponentNameProps {
  // props 定义
}
```

### 导入顺序（Biome 强制）

```typescript
// 1. 外部包
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. 内部包
import { auth } from '@repo/auth';
import { Button } from '@repo/ui/components/button';

// 3. 应用内导入
import { createLecture } from '@/app/actions/lectures';
import type { Lecture } from '@/types';
```

### React 组件规范

```typescript
// ✅ 正确：函数声明
export function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>;
}

// ✅ 正确：客户端组件标记
'use client';

// ✅ 正确：Hook 命名
export function useDebounce<T>(value: T, delay: number): T {
  // 实现
}
```

## 组件开发

### 创建新组件

```typescript
// apps/web/src/components/lecture-card.tsx
'use client';

import { cn } from '@/lib/utils';
import type { Lecture } from '@/types';

interface LectureCardProps {
  lecture: Lecture;
  className?: string;
}

export function LectureCard({ 
  lecture, 
  className 
}: LectureCardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-4',
      'transition-all hover:shadow-md',
      className
    )}>
      <h3 className="text-lg font-semibold">
        {lecture.title}
      </h3>
      {/* 组件内容 */}
    </div>
  );
}
```

### 使用 shadcn/ui

```bash
# 在应用中使用
import { Dialog } from '@repo/ui/components/dialog';
```

### 样式规范

```typescript
// ✅ 正确：语义化颜色
<div className="bg-primary text-primary-foreground">
<div className="bg-destructive/10 text-destructive">

// ✅ 正确：响应式设计
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ✅ 正确：使用 cn 合并类名
<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className
)}>
```

## Server Actions

### 创建 Server Action

```typescript
// apps/web/src/app/actions/lectures.ts
'use server';

import { db } from '@repo/db';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

export async function createLecture(
  input: CreateLectureInput
): Promise<ActionResult<Lecture>> {
  try {
    // 1. 身份验证
    const { user } = await requireAuth();
    
    // 2. 参数验证
    const validated = createLectureSchema.parse(input);
    
    // 3. 数据库操作
    const lecture = await db.transaction(async (tx) => {
      // 事务操作
    });
    
    // 4. 重验证路径
    revalidatePath('/lectures');
    
    // 5. 返回结果
    return { success: true, data: lecture };
  } catch (error) {
    return handleActionError(error);
  }
}
```

### 客户端调用

```typescript
// components/create-lecture-form.tsx
'use client';

import { createLecture } from '@/app/actions/lectures';
import { toast } from 'sonner';

export function CreateLectureForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createLecture({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
    });
    
    if (result.success) {
      toast.success('创建成功');
      router.push(`/lectures/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  }
  
  return (
    <form action={handleSubmit}>
      {/* 表单内容 */}
    </form>
  );
}
```

## 数据库操作

### Schema 定义

```typescript
// packages/db/src/schema/lectures.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const lectures = pgTable('lectures', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  owner_id: text('owner_id').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// 导出类型
export type Lecture = typeof lectures.$inferSelect;
export type NewLecture = typeof lectures.$inferInsert;
```

### 查询示例

```typescript
// 基础查询
const lectures = await db
  .select()
  .from(lectures)
  .where(eq(lectures.owner_id, userId));

// 联表查询
const lectureWithStats = await db
  .select({
    lecture: lectures,
    participantCount: count(lectureParticipants.id),
  })
  .from(lectures)
  .leftJoin(lectureParticipants, 
    eq(lectures.id, lectureParticipants.lecture_id)
  )
  .groupBy(lectures.id);

// 事务操作
await db.transaction(async (tx) => {
  const lecture = await tx.insert(lectures).values(data);
  await tx.insert(participants).values({ lecture_id: lecture.id });
});
```

## 调试技巧

### 开发工具

1. **React DevTools** - 组件调试
2. **Network 面板** - Server Actions 调试
3. **Drizzle Studio** - 数据库查看

### Server Actions 调试

```typescript
export async function myAction(input: Input) {
  console.log('Action 调用:', input);
  
  try {
    const result = await operation();
    console.log('操作结果:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('操作失败:', error);
    return { success: false, error: error.message };
  }
}
```

### 性能监控

```typescript
// 使用 React Profiler
import { Profiler } from 'react';

<Profiler
  id="LectureList"
  onRender={(id, phase, actualDuration) => {
    console.log(`${id} 渲染耗时: ${actualDuration}ms`);
  }}
>
  <LectureList />
</Profiler>
```

## 常见问题

### 模块找不到？

```bash
rm -rf node_modules .next
bun install --no-cache
```

### 类型错误？

```bash
bun check
bun format
```

### Server Action 认证失败？

确保：
1. 用户已登录
2. 调用了 `requireAuth()`
3. 环境变量配置正确

### 数据库连接失败？

```bash
# 检查连接
bun db:status

# 重启数据库
bun db:restart
```

### 构建失败？

```bash
# 清理缓存
rm -rf .next .turbo

# 重新构建
bun build
```

## 开发建议

1. **遵循 CLAUDE.md** - 项目特定规范
2. **类型优先** - 充分利用 TypeScript
3. **小步提交** - 保持 Git 历史清晰
4. **充分测试** - 手动测试关键路径
5. **性能意识** - 注意包大小和加载时间

---

> 需要帮助？查看 [GitHub Discussions](https://github.com/GeminiProjects/quizgen/discussions) 或提交 Issue。