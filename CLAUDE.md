# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

QuizGen 是一个演讲即时智能评测系统，基于 Turborepo monorepo 架构。

**核心功能**：
- 演讲者一键生成四选一选择题并推送给听众
- 听众实时答题获得即时反馈
- 演讲者查看全场正确率，判断讲述效果
- 组织者管理系列演讲，查看整体参与度

**技术栈**：
- Next.js 15.4.4 + React 19 (App Router + Server Actions)
- Better Auth (GitHub OAuth + 匿名登录)
- Drizzle ORM + PostgreSQL (Neon)
- Google Gemini 2.5 Pro
- TailwindCSS 4 + shadcn/ui

## 核心业务模块

应用分三个核心模块，使用 Server Actions 实现数据交互：

### 1. Lectures（演讲管理）
- 路径：`src/app/(dashboard)/lectures/`
- 功能：创建演讲、控制状态、管理材料、生成测验、查看转录
- Server Actions：`lectures.ts`、`materials.ts`、`quiz.ts`

### 2. Organizations（组织管理）
- 路径：`src/app/(dashboard)/organizations/`
- 功能：创建组织、管理成员、查看组织演讲
- Server Actions：`organizations.ts`

### 3. Participation（参与互动）
- 路径：`src/app/(dashboard)/participation/`
- 功能：参与答题、查看历史记录、实时接收题目
- Server Actions：`participation.ts`、`comments.ts`

## 关键目录结构

```
apps/web/src/
├── app/
│   ├── (dashboard)/     # 主应用模块
│   ├── actions/         # Server Actions（核心）
│   │   ├── lectures.ts     # 演讲管理
│   │   ├── organizations.ts # 组织管理
│   │   ├── quiz.ts         # 测验生成
│   │   ├── materials.ts    # 材料管理
│   │   ├── participation.ts # 参与互动
│   │   └── comments.ts     # 评论系统
│   └── api/             # API 路由（SSE、流式传输）
├── components/          # 共享组件
├── hooks/               # 自定义 Hooks
├── lib/
│   ├── auth.ts         # 认证工具
│   └── schemas/        # Zod 验证
└── types.ts            # 全局类型定义
```

## 类型系统规范

所有共享类型集中定义在 `src/types.ts`：
- User、Organization、Lecture、QuizItem、Material 等核心类型
- 使用 `DateToString<T>` 处理 Server Actions 日期序列化
- 继承数据库类型并扩展：`interface User extends DateToString<DBUser>`

## Server Actions 开发规范

```typescript
// src/app/actions/lectures.ts
'use server';

export async function createLecture(data: CreateLectureInput) {
  // 1. 身份验证
  const { user } = await requireAuth();
  
  // 2. 参数验证（使用 Zod）
  const validated = createLectureSchema.parse(data);
  
  // 3. 数据库操作
  const lecture = await db.insert(...);
  
  // 4. 重新验证路径
  revalidatePath('/lectures');
  
  // 5. 返回序列化数据
  return lecture;
}
```

## 开发命令

```bash
# 项目根目录执行
bun dev                 # 启动开发服务器
bun check               # 类型检查 + 代码检查
bun format              # 格式化代码
bun db:push             # 推送数据库变更
bun db:studio           # 数据库管理界面

# 验证代码（修改后必须执行）
cd apps/web && bun check && cd ../.. && bun format
```

## 导入规范

```typescript
// 跨包导入
import { auth } from '@repo/auth';
import { db, schema } from '@repo/db';
import { Button } from '@repo/ui/components/button';

// 应用内导入
import { createLecture } from '@/app/actions/lectures';
import type { Lecture } from '@/types';
import { requireAuth } from '@/lib/auth';
```

## UI 设计规范

- 颜色系统：`bg-primary/10`、`bg-success/10`、`bg-info/10`、`bg-warning/10`、`bg-destructive/10`
- 支持 dark/light 模式自动切换
- 图标容器：`"flex h-9 w-9 items-center justify-center rounded-lg"`

## 代码规范

### TypeScript 类型规范

- **禁止 `any`**：使用 `unknown` 或具体类型
- **类型导入**：必须使用 `import type`
- **错误处理**：`catch (error: unknown)`
- **日期处理**：Server Actions 返回需序列化 `.toISOString()`

### 导入顺序规范（Biome.js 强制）

```typescript
// 1. 外部包
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. 内部包（@repo/*）
import { auth } from '@repo/auth';
import { Button } from '@repo/ui/components/button';

// 3. 应用内导入（@/*）
import { createLecture } from '@/app/actions/lectures';
import { cn } from '@/lib/utils';

// 4. 类型导入
import type { User, Lecture } from '@/types';
```

### Server Actions 规范

1. 身份验证：`await requireAuth()`
2. 参数验证：Zod schema
3. 路径重验证：`revalidatePath()`
4. 错误处理：返回统一格式 `{ success, data?, error? }`
5. 日期序列化：使用 `.toISOString()`

### React 组件规范

- 客户端组件：文件顶部加 `'use client'`
- Props 接口：`interface ComponentNameProps`
- Hook 命名：必须以 `use` 开头

### Biome.js 配置

- 允许：`console`、循环中 `await`、嵌套三元运算符
- 强制：导入排序、类型安全、格式化

## 重要约束

1. **包管理**：使用 Bun，安装依赖加 `--no-cache`
2. **类型定义**：集中在 `src/types.ts`，禁用 `any`
3. **数据交互**：优先 Server Actions，必须验证和身份认证
4. **代码质量**：修改后必须执行 `bun check` 和 `bun format`