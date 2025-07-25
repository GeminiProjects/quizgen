# QuizGen 文档中心

QuizGen 演讲即时智能评测系统的完整技术文档。

> 文档由 Claude Opus 4 编写
> 最后更新：2025-07-25

## 📚 文档导航

### 核心文档
- [**项目架构**](./architecture.md) - Turborepo monorepo 架构设计
- [**API 文档**](./api.md) - Server Actions 接口规范
- [**数据库设计**](./database.md) - PostgreSQL + Drizzle ORM 数据模型
- [**开发指南**](./development.md) - 本地环境搭建和开发流程
- [**部署指南**](./deployment.md) - Vercel 生产部署配置

### 项目规划
- [**原始需求**](./origin/requirement.md) - 业务需求说明
- [**贡献指南**](../CONTRIBUTING.md) - 参与项目贡献

## 🚀 快速开始

### 技术栈速览

| 类别         | 技术                     | 版本            |
| ------------ | ------------------------ | --------------- |
| **核心框架** | Next.js + React          | 15.4.4 + 19.1.0 |
| **编程语言** | TypeScript               | 5.8.3           |
| **包管理器** | Bun                      | 1.2.19          |
| **样式方案** | TailwindCSS + shadcn/ui  | 4.1.11          |
| **数据库**   | PostgreSQL + Drizzle ORM | 17 + 0.44       |
| **身份认证** | Better Auth              | 0.2             |
| **AI 服务**  | Google Gemini 2.5 Pro    | -               |

### 面向角色指南

#### 👨‍💻 开发者路径
1. 阅读[项目架构](./architecture.md)了解系统设计
2. 参考[开发指南](./development.md)搭建环境
3. 查看[API 文档](./api.md)了解 Server Actions
4. 遵循[贡献指南](../CONTRIBUTING.md)提交代码

#### 🏗️ 架构师关注
- [Monorepo 结构](./architecture.md#项目结构)
- [技术决策](./architecture.md#技术选型)
- [数据模型](./database.md#数据模型设计)

#### 🚀 运维部署
- [Vercel 部署](./deployment.md#vercel-部署)
- [环境变量配置](./deployment.md#环境变量)
- [数据库管理](./deployment.md#数据库配置)

## 🔍 常见任务

| 任务               | 命令/路径                 |
| ------------------ | ------------------------- |
| 启动开发服务器     | `bun dev`                 |
| 创建 Server Action | `src/app/actions/*.ts`    |
| 添加数据库表       | `packages/db/schema/*.ts` |
| 运行类型检查       | `bun check`               |
| 格式化代码         | `bun format`              |

## 💡 核心概念

### Server Actions
Next.js 15 的核心特性，替代传统 API 路由：
- 类型安全的服务端函数
- 自动序列化和验证
- 内置错误处理

### 三大业务模块
1. **Lectures** - 演讲管理（创建、控制、生成测验）
2. **Organizations** - 组织管理（成员、权限、演讲列表）
3. **Participation** - 参与互动（答题、查看历史）

### 统一类型系统
所有共享类型定义在 `apps/web/src/types.ts`：
- 处理 Server Actions 日期序列化
- 扩展数据库类型
- 统一前后端类型

## 📝 文档维护

- 文档与代码同步更新
- 优先确保准确性
- 保持简洁清晰
- 提供可执行示例

---

> 💬 发现问题？在 [GitHub Issues](https://github.com/GeminiProjects/quizgen/issues) 反馈