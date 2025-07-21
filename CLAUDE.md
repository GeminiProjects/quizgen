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

## 前端设计规范

### 颜色 + Icon 样式设计语言
使用 CSS 变量系统，支持 dark/light 模式自动切换：

```typescript
// 主色调 - 使用 primary 颜色系统
<div className="bg-primary/10 text-primary">
  <Sparkles className="h-4 w-4" />
</div>

// 成功/积极色调 - 使用 success 颜色系统
<div className="bg-success/10 text-success">
  <MessageSquare className="h-4 w-4" />
</div>

// 信息/数据色调 - 使用 info 颜色系统
<div className="bg-info/10 text-info">
  <ChartBar className="h-4 w-4" />
</div>

// 警告色调 - 使用 warning 颜色系统
<div className="bg-warning/10 text-warning">
  <AlertTriangle className="h-4 w-4" />
</div>

// 错误/删除色调 - 使用 destructive 颜色系统
<div className="bg-destructive/10 text-destructive">
  <Trash2 className="h-4 w-4" />
</div>

// 辅助色调 - 使用 secondary 颜色系统
<div className="bg-secondary/10 text-secondary-foreground">
  <Settings className="h-4 w-4" />
</div>

// 强调色调 - 使用 accent 颜色系统
<div className="bg-accent/10 text-accent-foreground">
  <Star className="h-4 w-4" />
</div>
```

设计原则：
- 图标容器使用 `flex h-9 w-9 items-center justify-center rounded-lg` 或 `h-10 w-10`
- 背景色使用 `/10` 透明度，文字色使用对应的实色变量
- 图标尺寸通常为 `h-4 w-4` 或 `h-5 w-5`
- 优先使用 lucide-react 图标库保持一致性
- 使用 CSS 变量确保 dark/light 模式自动适配