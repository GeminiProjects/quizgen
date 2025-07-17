# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

QuizGen 是一个演讲即时智能评测系统，基于 Turborepo monorepo 架构。核心功能包括：
- 演讲者一键生成四选一选择题并推送给听众
- 听众实时答题获得即时反馈
- 演讲者查看全场正确率，判断讲述效果
- 组织者管理系列演讲，查看整体参与度

技术栈：Next.js 19 + React Server Components、Better Auth、Drizzle ORM + PostgreSQL、Vercel AI SDK + Gemini Pro

## 项目架构

### Workspace 结构
```
apps/
  web/              # Next.js 前端应用
packages/
  auth/             # Better Auth 身份认证
  db/               # Drizzle ORM 数据库层
  ui/               # shadcn/ui 组件库
  ai/               # AI 相关功能
```

### 导入规范
```typescript
// 包导入 - 通过 index.ts 导出所有内容
import { ... } from '@repo/auth'; 
import { ... } from '@repo/db';

// UI 组件导入 - 通过 components 目录导入指定组件
import { ... } from '@repo/ui/components/xxx';

// 应用内导入 - 使用路径别名
import { ... } from '@/components/xxx';
```

## 开发工作流

### 常用命令
```bash
# 根目录 - 全局命令
bun dev                    # 启动开发服务器
bun build                  # 构建所有包
bun check                  # 类型检查 + 代码检查所有包
bun format                 # 格式化代码

# 数据库相关
bun db:generate            # 生成数据库迁移
bun db:push                # 推送数据库变更
bun db:studio              # 打开数据库管理界面

# 特定包开发
cd apps/web && bun dev     # 启动 web 应用
cd packages/db && bun test # 运行数据库测试
```

### 开发规范
1. **代码修改后必须验证 + 格式化**：
   - 在 `apps/web` 写代码后：`cd apps/web && bun check` 直到类型检查和代码质量过关，然后执行 `bun format` 格式化代码

2. **路径别名使用**：
   - 优先使用 tsconfig.json 中的 paths 配置
   - 使用 `@/components/xxx` 而不是 `../../src/components/xxx`

3. **包管理**：
   - 统一使用 Bun 作为包管理器
   - 模块前缀统一为 `@repo/`

## 核心组件

### 数据模型
- `users` - 用户表（Better Auth 创建）
- `organizations` - 组织表（演讲集合管理）
- `lectures` - 演讲会话表
- `materials` - 预上传文本材料
- `transcripts` - 实时转录片段
- `quiz_items` - AI 生成的测验题目
- `attempts` - 听众答题记录

### 身份认证
- 使用 Better Auth 提供 GitHub OAuth 登录
- 支持多角色用户系统：组织者、演讲者、听众

#### apps/web 身份认证工具函数
在 `apps/web/src/lib/auth.ts` 中封装了身份认证相关的工具函数：

```typescript
// 推荐使用：封装的工具函数
import { getServerSideSession } from '@/lib/auth';
const session = await getServerSideSession();

// 避免直接使用：原始 Better Auth API
import { auth } from '@repo/auth';
const session = await auth.api.getSession({ headers: await headers() });
```

封装的工具函数提供了：
- 统一的错误处理
- 简化的 API 调用
- 类型安全的会话获取

参考 [docs/project_design.md](./docs/project_design.md) 了解完整项目设计