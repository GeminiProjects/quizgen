
# 开发指南

本文旨在快速介绍本项目使用的一些技术栈，并提供一些开发、维护指南。  
在开始之前，推荐使用 [Cursor](https://cursor.com) 作为 IDE。  

本项目自带一些 [Cursor Rules](https://docs.cursor.com/context/rules)，用于增强 AI 辅助编辑的体验。

## 本地开发

**启动开发服务器**

```
bun dev
```

**代码格式化**

我们使用 [Biome](https://biomejs.dev) 作为代码格式化、类型检查等质量保障。
确保你的 IDE (VSCode / Cursor) 已安装 [biomejs.biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) 扩展。

- **自动格式化** 保存时自动格式化代码
- **质量保证** 会有一些代码质量规则，提示警告

```
# 检查整个项目的代码
bun lint

# 格式化整个项目的代码
bun format
```

```
bun format
```

**数据库管理**

我们使用
- [Drizzle](https://orm.drizzle.team/docs/introduction) 作为 ORM，  
- [Neon Postgres](https://neon.tech/docs/introduction) 作为 Postgres 数据库云托管。

目前处于敏捷开发、快速迭代阶段，不考虑分支 (开发和生产共用同一数据库)。

```
# 将 Schema 强制推送到数据库
# Schema 即为数据库表格模式、结构，在 `packages/db/src/schema` 目录下定义
bun db:push

# 本地开启 Drizzle Studio 查看、管理数据库
bun db:studio
```