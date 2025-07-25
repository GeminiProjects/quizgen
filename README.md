# QuizGen - 演讲即时智能评测系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Powered by Bun](https://img.shields.io/badge/powered%20by-Bun-red.svg)](https://bun.sh/)
[![Built with Turborepo](https://img.shields.io/badge/built%20with-Turborepo-blueviolet.svg)](https://turbo.build/)
[![Documentation](https://img.shields.io/badge/docs-available-green.svg)](./docs/README.md)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/e7ae9997-82f7-4a1d-9a3b-fb1b846f971e">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/457b7180-57c2-4aed-8e46-8f5576c9b00a">
  <img alt="Product Preview" src="https://github.com/user-attachments/assets/457b7180-57c2-4aed-8e46-8f5576c9b00a">
</picture>

> 毕业实习校内团队项目 - 基于 AI 的演讲实时互动平台

## 项目简介

QuizGen 是一个演讲即时智能评测系统，通过 AI 技术自动生成测验题目，帮助演讲者实时了解听众的理解程度，提升演讲效果和互动体验。

### 核心特性

- **AI 智能出题** - 基于演讲内容自动生成高质量测验题
- **实时数据分析** - 即时查看答题情况和理解程度
- **多角色支持** - 演讲者、听众、组织者完整生态
- **隐私保护** - 匿名参与，保护用户隐私
- **跨平台支持** - 响应式设计，支持各种设备

## 文档

- [**目录索引**](./docs/README.md) - 完整的项目文档索引
  - [项目架构](./docs/architecture.md) - 系统设计和技术架构
  - [API 文档](./docs/api.md) - Server Actions 接口说明
  - [数据库设计](./docs/database.md) - 数据模型详解
  - [部署指南](./docs/deployment.md) - 生产环境部署
  - [开发指南](./docs/development.md) - 本地开发指南
  - [贡献指南](./CONTRIBUTING.md) - 如何参与贡献


## 技术栈

| 类型   | 名称                                                | 版本  | 描述             |
| ------ | --------------------------------------------------- | ----- | ---------------- |
| 语言   | [TypeScript](https://www.typescriptlang.org/)       | ^5.8  | 编程语言         |
| 工具链 | [Bun](https://bun.sh)                               | ^1.2  | 包管理器、运行时 |
|        | [Biome](https://biomejs.dev)                        | ^2.0  | 代码检查、格式化 |
|        | [Turborepo](https://turbo.build)                    | ^2.5  | 构建工具         |
| 前端   | [React](https://react.dev)                          | ^19   | 前端框架         |
|        | [Next.js](https://nextjs.org)                       | ^15   | 全栈框架         |
|        | [TailwindCSS](https://tailwindcss.com)              | ^4    | 样式框架         |
|        | [shadcn/ui](https://ui.shadcn.com)                  | -     | UI 组件库        |
| 数据库 | [Postgres](https://www.postgresql.org/)             | ^17   | 关系型数据库     |
|        | [Drizzle](https://orm.drizzle.team)                 | ^0.44 | 数据库 ORM       |
| 认证   | [Better Auth](https://better-auth.com)              | ^0.2  | 身份认证服务     |
| 云服务 | [Vercel](https://vercel.com)                        | -     | Next.js 应用部署 |
|        | [Neon Serverless](https://neon.tech)                | -     | Postgres 云服务  |
|        | [Gemini API](https://ai.google.dev/gemini-api/docs) | -     | 大模型 API       |

## 开发指南

### 项目结构

QuizGen 使用 [Turborepo](https://turbo.build/repo/docs) 管理 Monorepo 架构：

```
quizgen/
├── apps/
│   └── web/                    # Next.js 全栈应用
├── packages/
│   ├── ai/                    # AI 功能封装
│   ├── auth/                  # Better Auth 身份认证
│   ├── db/                    # Drizzle ORM 数据库层
│   ├── ui/                    # shadcn/ui 组件库
│   └── tsconfig/              # TypeScript 配置共享
└── docs/                      # 项目文档
```


### 环境要求

- **Bun**: 1.2+ 版本（包管理器 + 运行时）
- **Git**: 版本控制
- **Docker**: 用于运行本地数据库（可选）
- **IDE**: [Visual Studio Code](https://code.visualstudio.com) 或 [Cursor](https://cursor.com)

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
> 你应该安装本项目提示的推荐扩展。
>   
> - [bradlc.vscode-tailwindcss](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) (用于 TailwindCSS 的语法高亮和自动补全)
> - [biomejs.biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) (用于代码检查和格式化)

#### 3. 安装依赖

```bash
# 安装依赖
bun install
```

#### 4. 配置环境变量

我们提供了一个交互式配置向导，帮助你快速设置环境变量：

```bash
# 运行配置向导
bun setup
```

配置向导将引导你设置以下内容：

1. **Google API Key**（**必填**）
   - 访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 创建 API Key
   - 用于生成智能测验题目

2. **Better Auth Secret**（可选）
   - 留空将自动生成随机密钥
   - 用于身份认证加密

3. **GitHub OAuth**（可选）
   - 访问 [GitHub Developer Settings](https://github.com/settings/developers) 创建 OAuth App
   - 回调 URL 设置为: `http://localhost:3000/api/auth/callback/github`
   - 用于用户登录，如果不选本地也支持 `匿名登录` 快速测试

4. **数据库配置**（可选）
   - 留空将自动启动本地 PostgreSQL 17 数据库（需要 Docker）
   - 或者提供自己的 PostgreSQL 数据库 URL

> [!TIP]
> 如果选择使用本地数据库，确保已安装并运行 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。

#### 5. 数据库管理

如果使用本地数据库，可以使用以下命令管理：

```bash
# 启动数据库和管理界面
bun db:start

# 停止数据库
bun db:stop

# 重启数据库
bun db:restart

# 查看数据库状态
bun db:status

# 查看数据库日志
bun db:logs

# 清理数据库数据（危险操作）
bun db:clean
```

数据库管理界面将在 https://local.drizzle.studio/ 运行。

#### 6. 启动开发服务器
```bash
bun dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🛠️ 常用命令

```bash
# 开发
bun dev              # 启动开发服务器
bun build            # 构建生产版本
bun check            # 运行类型检查和代码检查
bun format           # 格式化代码

# 数据库
bun db:start         # 启动本地数据库
bun db:studio        # 打开数据库管理界面
bun db:push          # 推送架构变更
bun db:generate      # 生成迁移文件

# 测试
bun run test         # 运行测试
```

## 参与贡献

我们欢迎所有形式的贡献！查看[贡献指南](./CONTRIBUTING.md)了解如何：

- 报告问题
- 提出新功能
- 提交代码
- 改进文档

## 许可证

本项目采用 [MIT 许可证](./LICENSE)。
