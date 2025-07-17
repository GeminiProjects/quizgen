# QuizGen 开发入门指南

本文档面向新手开发者，提供详细的开发环境搭建、技术栈介绍和开发流程指导。

## 📋 准备工作

### 环境要求
- **Node.js**: 18+ 版本
- **Bun**: 1.2+ 版本（推荐包管理器）
- **Git**: 版本控制
- **IDE**: 推荐使用 [Cursor](https://cursor.com) 或 VSCode

### 系统要求
- **操作系统**: macOS, Windows, Linux

## 🛠️ 开发环境搭建

### 1. 安装 Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# 验证安装
bun --version
```

### 2. 克隆项目
```bash
git clone https://github.com/GeminiProjects/quizgen.git
cd quizgen
```

### 3. 安装依赖
```bash
bun install
```

### 4. 环境变量配置
创建 `.env.local` 文件：
```bash
cp .env.example .env.local
```

配置以下环境变量：
```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/quizgen"

# 身份认证
AUTH_SECRET="your-auth-secret-here"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI API
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
```

### 5. 数据库设置
```bash
# 推送数据库架构
bun db:push

# 打开数据库管理界面
bun db:studio
```

### 6. 启动开发服务器
```bash
bun dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🧱 项目架构详解

### Monorepo 结构
QuizGen 使用 Turborepo 管理多包架构：

```
quizgen/
├── apps/
│   └── web/                    # Next.js 全栈应用
│       ├── src/
│       │   ├── app/           # App Router 页面和 API 路由
│       │   │   ├── api/       # API 路由
│       │   │   ├── layout.tsx # 根布局
│       │   │   └── page.tsx   # 首页
│       │   ├── components/    # 应用级组件
│       │   │   ├── auth/      # 认证组件
│       │   │   └── theme-provider.tsx
│       │   ├── lib/           # 工具函数
│       │   │   ├── auth.ts    # 认证工具
│       │   │   ├── api-utils.ts # API 工具
│       │   │   └── schemas/   # 数据验证模式
│       │   └── middleware.ts  # 中间件
│       ├── public/            # 静态资源
│       ├── next.config.ts     # Next.js 配置
│       └── package.json
├── packages/
│   ├── auth/                  # Better Auth 身份认证
│   ├── db/                    # Drizzle ORM 数据库层
│   ├── ui/                    # shadcn/ui 组件库
│   ├── ai/                    # AI 功能封装
│   └── tsconfig/              # TypeScript 配置共享
└── docs/                      # 项目文档
```

## 技术栈详解

### 前端技术栈

#### Next.js 15 + React 19
- **App Router**: 新的路由系统，支持嵌套路由和布局
- **React Server Components**: 服务器端组件，提升性能
- **TypeScript**: 类型安全的 JavaScript 超集

#### 样式和 UI
- **TailwindCSS 4.0**: 实用优先的 CSS 框架
- **shadcn/ui**: 基于 Radix UI 的组件库
- **next-themes**: 主题切换支持
- **Lucide React**: 图标库

#### 状态管理
- **React Hook Form**: 表单管理
- **Zod**: 数据验证
- **React Context**: 全局状态管理

### 后端技术栈

#### API 层
- **Next.js API Routes**: 服务器端 API
- **TypeScript**: 类型安全的后端代码

#### 数据库
- **PostgreSQL**: 开源关系型数据库
- **Neon**: Serverless PostgreSQL 托管服务
- **Drizzle ORM**: 类型安全的 SQL ORM

#### 身份认证
- **Better Auth**: 现代身份认证库
- **GitHub OAuth**: 社交登录
- **Session Management**: 会话管理

#### AI 服务
- **Vercel AI SDK**: AI 应用开发框架
- **Google Gemini Pro**: 大语言模型
- **实时语音转录**: 语音识别服务

### 开发工具

#### 包管理
- **Bun**: 快速的包管理器和运行时
- **Turborepo**: Monorepo 构建系统
- **Workspace**: 包间依赖管理

#### 代码质量
- **Biome**: 代码格式化和检查
- **TypeScript**: 类型检查
- **ESLint**: 代码规范检查

## 开发流程

### 1. 新功能开发

#### 1.1 创建功能分支
```bash
git checkout -b feature/new-feature
```

#### 1.2 开发环境准备
```bash
# 启动开发服务器
bun dev

# 启动数据库管理界面
bun db:studio
```

#### 1.3 数据库修改
如果需要修改数据库结构：
```bash
# 1. 修改 packages/db/src/schema/*.ts 文件
# 2. 推送数据库变更
bun db:push
```

#### 1.4 编写代码
遵循项目代码规范，使用正确的导入路径。

#### 1.5 类型检查和格式化
```bash
# 类型检查
bun check

# 格式化代码
bun format
```

### 2. 代码规范

#### 2.1 导入规范
```typescript
// ✅ 正确：包导入
import { auth } from '@repo/auth';
import { db } from '@repo/db';
import { Button } from '@repo/ui/components/button';

// ✅ 正确：应用内导入
import { getServerSideSession } from '@/lib/auth';
import { ApiResponse } from '@/lib/api-utils';

// ❌ 错误：相对路径导入
import { auth } from '../../../packages/auth/src';
import { Button } from '../../components/ui/button';
```

#### 2.2 文件命名规范
- 组件文件：`kebab-case.tsx`
- 工具函数：`kebab-case.ts`
- 类型定义：`kebab-case.ts`
- 页面文件：`page.tsx`

#### 2.3 组件编写规范
```typescript
// ✅ 正确的组件结构
import { Button } from '@repo/ui/components/button';
import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await onAction();
    setIsLoading(false);
  };

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? '处理中...' : '确认'}
      </Button>
    </div>
  );
}
```

### 3. API 开发

#### 3.1 API 路由结构
```typescript
// apps/web/src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSideSession } from '@/lib/auth';
import { db } from '@repo/db';

export async function GET(request: NextRequest) {
  try {
    // 1. 身份验证
    const session = await getServerSideSession();
    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 2. 数据查询
    const data = await db.query.users.findMany();

    // 3. 返回结果
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
```

## 学习资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://reactjs.org/docs)
- [TailwindCSS 文档](https://tailwindcss.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs)
- [Better Auth 文档](https://better-auth.com/docs)

### 推荐教程
- [Next.js 13 App Router 教程](https://nextjs.org/learn)
- [React TypeScript 最佳实践](https://react-typescript-cheatsheet.netlify.app/)
- [TailwindCSS 入门指南](https://tailwindcss.com/docs/installation)

### 社区资源
- [Next.js GitHub](https://github.com/vercel/next.js)
- [React GitHub](https://github.com/facebook/react)
- [shadcn/ui GitHub](https://github.com/shadcn/ui)