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
- Next.js 15.3.5 + React 19 (App Router + Server Actions)
- Better Auth (GitHub OAuth + 匿名登录)
- Drizzle ORM + PostgreSQL (Neon)
- Google Gemini 2.5 Pro
- TailwindCSS 4 + shadcn/ui

## 前端核心模块

应用分为三个核心业务模块，全部使用 Server Actions 实现数据交互：

### 1. Lectures（演讲管理）
- 路径：`src/app/(dashboard)/lectures/`
- 功能：创建演讲、控制演讲状态、管理材料、生成测验、查看转录
- Server Actions：`src/app/actions/lectures.ts`

### 2. Organizations（组织管理）
- 路径：`src/app/(dashboard)/organizations/`
- 功能：创建组织、管理成员、查看组织下的演讲
- Server Actions：`src/app/actions/organizations.ts`

### 3. Participation（参与互动）
- 路径：`src/app/(dashboard)/participation/`
- 功能：参与者答题、查看历史参与记录（待开发）
- Server Actions：待实现

## 关键目录结构

```
apps/web/src/
├── app/
│   ├── (dashboard)/     # 主应用模块
│   │   ├── lectures/    # 演讲管理
│   │   ├── organizations/ # 组织管理
│   │   └── participation/ # 参与互动
│   ├── actions/         # Server Actions（重要）
│   │   ├── lectures.ts
│   │   ├── organizations.ts
│   │   ├── quiz.ts
│   │   └── materials.ts
│   └── api/             # API 路由（仅特殊场景）
├── components/          # 共享组件
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具函数
│   ├── auth.ts         # 认证工具
│   ├── api-utils.ts    # API 响应工具
│   └── schemas/        # Zod 验证模式
└── types.ts            # 全局类型定义（重要）
```

## 类型系统规范

**重要原则：类型不应该随地大小便！**

所有共享类型必须定义在 `src/types.ts`：
- **User**：用户信息类型
- **Organization**：组织类型
- **Lecture**：演讲类型
- **QuizItem**：测验题目类型
- **Material**：材料类型
- **LectureStatus**：演讲状态枚举

特殊处理：Server Actions 返回的 Date 会被序列化为 string，使用 `DateToString<T>` 类型转换。

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

## 关键开发命令

```bash
# 必须在项目根目录执行
bun dev                 # 启动开发服务器
bun check               # 类型检查 + 代码检查
bun format              # 格式化代码
bun db:push             # 推送数据库变更
bun db:studio           # 数据库管理界面

# 代码修改后的验证流程
cd apps/web && bun check    # 必须通过检查
cd ../.. && bun format      # 回到根目录格式化
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

使用统一的颜色系统，支持 dark/light 模式：

```typescript
// 颜色变量系统
bg-primary/10 text-primary       # 主色调
bg-success/10 text-success       # 成功态
bg-info/10 text-info             # 信息态
bg-warning/10 text-warning       # 警告态
bg-destructive/10 text-destructive # 错误态

// 图标容器标准样式
"flex h-9 w-9 items-center justify-center rounded-lg"
```

## 重要注意事项

1. **必须使用 Bun**：所有包管理命令使用 `bun`，安装依赖时加 `--no-cache`
2. **类型定义集中**：共享类型只在 `src/types.ts` 定义，避免重复定义
3. **Server Actions 优先**：数据操作优先使用 Server Actions，而非 API 路由
4. **身份验证**：所有 Server Actions 必须调用 `requireAuth()`
5. **路径重验证**：数据变更后必须 `revalidatePath()` 更新缓存
6. **Zod 验证**：所有外部输入必须经过 Zod schema 验证
7. **错误处理**：Server Actions 应返回统一的错误格式
8. **代码验证**：提交前必须通过 `bun check`