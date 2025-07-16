
# 开发指南

本文旨在快速介绍本项目使用的一些技术栈，并提供一些开发、维护指南。  
在开始之前，推荐使用 [Cursor](https://cursor.com) 作为 IDE。  

- 本项目自带一些 [Cursor Rules](https://docs.cursor.com/context/rules)，用于增强 AI 辅助编辑的体验。
- 同时，你的 IDE (VSCode / Cursor) 应该会自动推荐安装以下扩展：

- [bradlc.vscode-tailwindcss](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) 增强 Tailwind CSS 的语法体验
- [biomejs.biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) 用于自动代码格式化、类型检查等

## 技术栈

本项目使用以下技术栈：

工具链：
- [Turborepo](https://turbo.build/repo) 管理 [Monorepo](https://zh.wikipedia.org/zh-cn/Monorepo) 项目
- [Bun](https://bun.sh) 包管理器和本地开发运行时
- [Biome](https://biomejs.dev) 代码格式化、类型检查等质量保障

语言:
- [TypeScript](https://www.typescriptlang.org)

框架:
- [Next.js](https://nextjs.org)
- [Hono](https://hono.dev)

云服务基建：
- [Vercel](https://vercel.com) 部署 Next.js 前端
- [Cloudflare Workers](https://workers.cloudflare.com) 部署 Hono API 后端

## 本地开发

```
# 启动开发服务器
bun dev
```

## 常见操作指南

### 1.1 Git 源代码管理

- 提交时，遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范。

### 2.1 格式化代码

已经配置 `Biome.js` 和相关 `VSCode` 配置。默认保存时会自动格式化代码。

亦可使用命令:

```
bun format
```