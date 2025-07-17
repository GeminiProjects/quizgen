# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuizGen (演讲即时智能评测系统) is a real-time assessment system for campus presentations. It enables speakers to generate AI-powered quizzes during presentations, audiences to answer questions with instant feedback, and organizers to manage lecture series with participation metrics.

- 参考 [docs/project_design.md](./docs/project_design.md) 了解项目设计
- 模块的前缀是 `@repo/`
- 总是参考 tsconfig.json 中的 paths 配置，优先使用别名，例如使用 `'@/schema/index'` 而不是 `'../../src/schema/index'`

常用指令
```
# 检查类型错误
bun typecheck
# 检查代码质量
bun lint
```

**Design Style**: Follow the design style in [docs/guide/design_style.txt](./docs/guide/design_style.txt)


常见导入使用

```
# 通过 index.ts 导入所有内容
import { ... } from '@repo/auth'; 
import { ... } from '@repo/db';

# 通过 components 目录导入指定 UI 组件
import { ... } from '@repo/ui/components/xxx';
```