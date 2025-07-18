# QuizGen 开发入门指南

本文档面向新手开发者，提供详细的开发环境搭建、技术栈介绍和开发流程指导。

## 📋 准备工作

### 环境要求
- **Bun**: 1.2+ 版本（包管理器 + 运行时）
- **Git**: 版本控制
- **IDE**: [Cursor](https://cursor.com) 或 [Visual Studio Code](https://code.visualstudio.com)

#### 1. 安装 Bun
```bash
# 安装 Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# 安装 Bun (Windows)
powershell -c "irm bun.sh/install.ps1 | iex"

# 验证安装
bun --version
```

#### 2. 克隆项目
```bash
# 从 GitHub 克隆项目
git clone https://github.com/GeminiProjects/quizgen.git

# 使用 VSCode 或 Cursor 打开项目
code quizgen
```

> [!IMPORTANT]
> 你应该安装 IDE 提示的推荐扩展。
>   
> - [bradlc.vscode-tailwindcss](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) (用于 TailwindCSS 的语法高亮和自动补全)
> - [biomejs.biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) (用于代码检查和格式化)

#### 3. 安装依赖

```bash
# 安装依赖
bun install
```

#### 4. 环境变量配置
创建 `.env.local` 文件：
```bash
# 复制环境变量示例文件
cp .env.example .env.local
```

配置以下环境变量：
```env
# Better Auth 认证密钥 (一段随机字符串)
BETTER_AUTH_SECRET=

# Github OAuth 凭证, 用于账户登录
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# 数据库 (Postgres URL)
DATABASE_URL=

# Google API Key
GOOGLE_GENERATIVE_AI_API_KEY=

# 开发时代理 (可选)
HTTP_PROXY=
HTTPS_PROXY=
```

> [!NOTE]
> 这里涉及一些基础环境配置
> - [Postgres](https://www.postgresql.org/) 数据库搭建
> - [Github OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) 创建与配置
> - [Google API Key](https://console.cloud.google.com/apis/credentials) 创建
> 
> 请自行研究, 本项目不再赘述。
>
> 首次创建数据库后，你可以通过 `bun db:push` 命令将数据库模式推送到数据库。

#### 7. 启动开发服务器
```bash
bun dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 技术架构

| 类型   | 技术栈                                                | 版本  | 描述             |
| ------ | ----------------------------------------------------- | ----- | ---------------- |
| 语言   | [TypeScript](https://www.typescriptlang.org/)         | ^5.8  | 编程语言         |
| 工具链 | [Bun](https://bun.sh)                                 | ^1.2  | 包管理器、运行时 |
|        | [Biome](https://biomejs.dev)                          | ^2.0  | 代码检查、格式化 |
|        | [Turborepo](https://turbo.build)                      | ^2.5  | 构建工具         |
| 前端   | [React](https://react.dev)                            | ^19   | 前端框架         |
|        | [Next.js](https://nextjs.org)                         | ^15   | 全栈框架         |
|        | [TailwindCSS](https://tailwindcss.com)                | ^4    | 样式框架         |
|        | [shadcn/ui](https://ui.shadcn.com)                    | -     | UI 组件库        |
| 数据库 | [Postgres](https://www.postgresql.org/)               | ^16   | 关系型数据库     |
|        | [Drizzle](https://orm.drizzle.team)                   | ^0.44 | 数据库 ORM       |
| 认证   | [Better Auth](https://better-auth.com)                | ^0.2  | 身份认证服务     |
| 云服务 | [Vercel](https://vercel.com)                          | -     | 云服务           |
|        | [Neon Serverless](https://neon.tech)                  | -     | Postgres 云服务  |
|        | [Cloudflare R2](https://developers.cloudflare.com/r2) | -     | 对象存储         |
|        | [Gemini API](https://ai.google.dev/gemini-api/docs)   | -     | 大模型 API       |

QuizGen 使用 [Turborepo](https://turbo.build/repo/docs) 管理多包架构：

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
│       │   ├── lib/           # 工具函数
│       │   └── middleware.ts  # 中间件
│       ├── public/            # 静态资源
│       ├── next.config.ts     # Next.js 配置
│       └── package.json
├── packages/
│   ├── ai/                    # AI 功能封装
│   ├── auth/                  # Better Auth 身份认证
│   ├── db/                    # Drizzle ORM 数据库层
│   ├── ui/                    # shadcn/ui 组件库
│   └── tsconfig/              # TypeScript 配置共享
└── docs/                      # 项目文档
```
