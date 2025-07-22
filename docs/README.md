# QuizGen 文档中心

欢迎来到 QuizGen 项目文档！这里包含了项目的完整技术文档、开发指南和参考资料。

## 📚 文档目录

### 快速开始
- [**项目概览**](../README.md) - 项目介绍和快速开始指南
- [**贡献指南**](../CONTRIBUTING.md) - 如何参与项目贡献

### 技术文档
- [**项目架构**](./architecture.md) - 系统架构设计和技术决策
- [**API 文档**](./api.md) - Server Actions API 详细说明
- [**数据库设计**](./database.md) - 数据模型和表结构设计
- [**部署指南**](./deployment.md) - 生产环境部署和配置
- [**开发指南**](./development.md) - 本地开发环境搭建和最佳实践

### 项目规划
- [**项目需求**](./origin/requirement.md) - 原始需求文档
- [**项目设计**](./project_design.md) - 功能设计和实现方案

## 🎯 文档导航

### 面向不同角色

#### 👨‍💻 开发者
1. 从[项目概览](../README.md)了解项目
2. 按照[开发指南](./development.md)搭建环境
3. 阅读[API 文档](./api.md)了解接口
4. 查看[贡献指南](../CONTRIBUTING.md)提交代码

#### 🏗️ 架构师
- [项目架构](./architecture.md) - 了解系统设计
- [数据库设计](./database.md) - 查看数据模型
- [技术选型](./architecture.md#技术架构) - 理解技术决策

#### 🚀 运维人员
- [部署指南](./deployment.md) - 部署到生产环境
- [环境配置](./deployment.md#环境变量) - 配置说明
- [监控方案](./deployment.md#监控与日志) - 系统监控

#### 📋 项目管理
- [项目需求](./origin/requirement.md) - 功能需求
- [项目设计](./project_design.md) - 实现方案
- [开发流程](../CONTRIBUTING.md#开发流程) - 协作流程

## 🔍 快速查找

### 常见任务

| 任务 | 文档链接 |
|------|----------|
| 本地运行项目 | [快速开始](../README.md#开发指南) |
| 创建新的 API | [Server Actions 规范](./api.md#server-actions-api) |
| 添加数据库表 | [数据库设计](./database.md#创建新表) |
| 部署到 Vercel | [Vercel 部署](./deployment.md#vercel-部署) |
| 提交 PR | [Pull Request 流程](../CONTRIBUTING.md#pull-request-流程) |

### 技术参考

| 技术 | 文档链接 |
|------|----------|
| Next.js 15 | [应用架构](./architecture.md#应用架构) |
| Server Actions | [API 文档](./api.md#server-actions-api) |
| Drizzle ORM | [数据库设计](./database.md#drizzle-orm) |
| Better Auth | [认证系统](./architecture.md#认证与授权) |
| TailwindCSS | [样式规范](../CONTRIBUTING.md#样式规范) |

## 📝 文档规范

### 文档编写原则

1. **清晰准确** - 使用简洁明了的语言
2. **示例驱动** - 提供可运行的代码示例
3. **保持更新** - 与代码同步更新文档
4. **结构化** - 使用合理的标题层级

### 文档模板

创建新文档时，请使用以下模板：

```markdown
# 文档标题

## 目录
- [概述](#概述)
- [详细内容](#详细内容)
- [示例](#示例)
- [常见问题](#常见问题)

## 概述
简要介绍文档内容

## 详细内容
详细说明

## 示例
代码示例

## 常见问题
Q&A 形式的问题解答
```

## 🤝 参与文档建设

发现文档错误或有改进建议？

1. 在 [GitHub Issues](https://github.com/GeminiProjects/quizgen/issues) 提出问题
2. 直接提交 PR 改进文档
3. 在 [Discussions](https://github.com/GeminiProjects/quizgen/discussions) 讨论

## 📊 文档统计

| 类别 | 文档数 | 最后更新 |
|------|--------|----------|
| 技术文档 | 5 | 2024-01 |
| 指南文档 | 2 | 2024-01 |
| 项目文档 | 2 | 2024-01 |

---

> 💡 **提示**: 使用 `Ctrl/Cmd + F` 在页面内搜索，或使用 GitHub 的搜索功能查找特定内容。