# QuizGen 部署指南

## 目录

- [概述](#概述)
- [部署架构](#部署架构)
- [前置准备](#前置准备)
- [Vercel 部署](#vercel-部署)
- [数据库配置](#数据库配置)
- [环境变量](#环境变量)
- [自定义域名](#自定义域名)
- [监控运维](#监控运维)
- [故障排查](#故障排查)

## 概述

QuizGen 采用 Serverless 架构，实现自动扩展和按需付费：

- **应用部署** - Vercel（Next.js 托管）
- **数据库** - Neon Serverless PostgreSQL
- **AI 服务** - Google Gemini 2.5 Pro
- **认证** - Better Auth + GitHub OAuth

## 部署架构

```mermaid
graph TB
    subgraph 用户
        A[浏览器]
    end
    
    subgraph Vercel
        B[Edge Network]
        C[Next.js Functions]
        D[静态资源 CDN]
    end
    
    subgraph Neon
        E[PostgreSQL 17]
        F[连接池]
    end
    
    subgraph 外部服务
        G[Google Gemini API]
        H[GitHub OAuth]
    end
    
    A --> B
    B --> C
    B --> D
    C --> F
    F --> E
    C --> G
    C --> H
```

## 前置准备

### 1. 注册账号

- [GitHub](https://github.com) - 代码托管 + OAuth
- [Vercel](https://vercel.com) - 应用部署
- [Neon](https://neon.tech) - 数据库服务
- [Google AI Studio](https://aistudio.google.com) - Gemini API

### 2. 获取凭证

#### Google Gemini API
```bash
# 访问 https://aistudio.google.com/app/apikey
# 创建 API Key
# 格式：AIza...
```

#### GitHub OAuth
```bash
# 访问 https://github.com/settings/developers
# 创建 OAuth App
# Homepage URL: https://your-app.vercel.app
# Callback URL: https://your-app.vercel.app/api/auth/callback/github
```

#### Neon 数据库
```bash
# 访问 https://console.neon.tech
# 创建项目，选择最近的区域
# 获取连接字符串（使用 pooled connection）
```

## Vercel 部署

### 快速部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/GeminiProjects/quizgen)

### 手动部署

1. **Fork 项目**
```bash
# Fork 到你的 GitHub 账号
https://github.com/GeminiProjects/quizgen
```

2. **导入 Vercel**
- 访问 [Vercel Dashboard](https://vercel.com/dashboard)
- Import Project → 选择 Fork 的仓库
- 配置设置：
  - Framework: Next.js
  - Build Command: `bun run build`
  - Install Command: `bun install`

3. **配置环境变量**（见下方环境变量章节）

4. **部署**
- 点击 Deploy
- 等待构建完成（约 3-5 分钟）

## 数据库配置

### 1. Neon 设置

```sql
-- 数据库会自动创建
-- 确保使用 PostgreSQL 17
-- 启用连接池（Pooling）
```

### 2. 运行迁移

```bash
# 本地执行
export DATABASE_URL="你的 Neon 连接字符串"
bun db:push
```

### 3. 连接池配置

Neon 控制台设置：
- Pool Mode: Transaction
- Pool Size: 25
- Pool Timeout: 10s

## 环境变量

### 必需变量

| 变量名                         | 说明              | 示例                                                         |
| ------------------------------ | ----------------- | ------------------------------------------------------------ |
| `DATABASE_URL`                 | Neon 数据库连接串 | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API 密钥   | `AIzaSy...`                                                  |
| `BETTER_AUTH_SECRET`           | 认证加密密钥      | 32位随机字符串                                               |
| `BETTER_AUTH_URL`              | 应用 URL          | `https://your-app.vercel.app`                                |

### 可选变量

| 变量名                 | 说明                | 默认值 |
| ---------------------- | ------------------- | ------ |
| `GITHUB_CLIENT_ID`     | GitHub OAuth ID     | -      |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | -      |
| `VERCEL_URL`           | Vercel 自动注入     | -      |

### Vercel 环境变量设置

```bash
# 方式1：控制台
项目设置 → Environment Variables → 添加变量

# 方式2：CLI
vercel env add DATABASE_URL production
vercel env add GOOGLE_GENERATIVE_AI_API_KEY production
vercel env add BETTER_AUTH_SECRET production
```

### 生成密钥

```bash
# Better Auth Secret
openssl rand -base64 32
```
