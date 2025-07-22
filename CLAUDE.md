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

## 代码规范与硬性约束

### TypeScript 类型规范（必须遵守）

1. **禁止使用 `any` 类型**
   ```typescript
   // ❌ 错误
   const data: any = fetchData();
   
   // ✅ 正确
   const data: unknown = fetchData();
   const data: User = fetchData();
   ```

2. **`unknown` 类型使用场景**
   - 错误处理：`catch (error: unknown)`
   - 泛型默认值：`ApiResponse<T = unknown>`
   - 动态数据：`Record<string, unknown>`

3. **类型导入必须使用 `import type`**
   ```typescript
   // ❌ 错误
   import { User } from '@/types';
   
   // ✅ 正确
   import type { User } from '@/types';
   ```

4. **接口扩展数据库类型**
   ```typescript
   // ✅ 正确的类型定义
   interface User extends DateToString<DBUser> {
     // 额外字段
   }
   ```

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

### Server Actions 强制规范

```typescript
'use server';

export async function actionName(input: InputType): Promise<OutputType> {
  // 1. 必须：身份验证（除非是公开接口）
  const session = await requireAuth();
  
  // 2. 必须：Zod 参数验证
  const validated = inputSchema.parse(input);
  
  try {
    // 3. 数据库操作
    const result = await db.transaction(async (tx) => {
      // 事务操作
    });
    
    // 4. 必须：路径重验证
    revalidatePath('/relevant-path');
    
    // 5. 必须：返回序列化数据
    return {
      success: true,
      data: serializeData(result),
    };
  } catch (error) {
    // 6. 必须：统一错误处理
    console.error('操作失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '操作失败',
    };
  }
}
```

### React 组件规范

1. **客户端组件标记**
   ```typescript
   'use client';  // 必须在文件顶部
   ```

2. **Props 接口命名**
   ```typescript
   interface ComponentNameProps {
     // props 定义
   }
   
   export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
     // 组件实现
   }
   ```

3. **Hook 命名规范**
   ```typescript
   // ✅ 正确
   export function useDialog() {}
   export function useUserData() {}
   
   // ❌ 错误
   export function dialog() {}
   export function getUserData() {}
   ```

### 错误处理规范

1. **统一的错误返回格式**
   ```typescript
   interface ActionResponse<T> {
     success: boolean;
     data?: T;
     error?: string;
   }
   ```

2. **数据库错误处理**
   ```typescript
   try {
     // 数据库操作
   } catch (error) {
     return handleDatabaseError(error);
   }
   ```

### Biome.js/Ultracite 配置要求

1. **禁用的规则（已配置，可以使用）**
   - `noAwaitInLoop`：允许循环中 await
   - `noConsole`：允许 console 语句
   - `noNestedTernary`：允许嵌套三元运算符

2. **必须遵守的规则**
   - 导入排序
   - 未使用变量
   - 类型安全
   - 空格和缩进

### 代码验证流程（强制）

```bash
# 每次修改代码后必须执行
cd apps/web && bun check    # 必须通过
cd ../.. && bun format      # 格式化代码

# check 包含：
# - TypeScript 类型检查（tsc --noEmit）
# - Biome.js 代码检查
```

### 常见错误及解决方案

1. **类型错误：`Object is possibly 'null'`**
   ```typescript
   // ❌ 错误
   const name = user.name;
   
   // ✅ 正确
   const name = user?.name;
   const name = user!.name; // 确定不为 null 时
   ```

2. **异步函数忘记 await**
   ```typescript
   // ❌ 错误
   const data = fetchData();
   
   // ✅ 正确
   const data = await fetchData();
   ```

3. **日期序列化问题**
   ```typescript
   // ✅ 正确处理
   return {
     ...lecture,
     created_at: lecture.created_at.toISOString(),
     updated_at: lecture.updated_at.toISOString(),
   };
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
9. **禁止 any**：绝对不能使用 `any` 类型，使用 `unknown` 或具体类型
10. **类型导入**：必须使用 `import type` 导入类型