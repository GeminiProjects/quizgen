## QuizGen 项目设计文档

---

### 1  项目简介

QuizGen 是一个校园演讲即时测评系统，服务于演讲者、听众和组织者三类用户角色。

**核心功能**：
- 演讲者在讲述过程中，一键生成四选一选择题并推送给听众
- 听众答题后立即获知对错，参与实时互动
- 演讲者可同步看到全场正确率，判断讲述节奏和理解度
- 组织者能够管理系列讲座，查看整体参与度和教学效果

---

### 2  技术栈

| 层次         | 选型 & 说明                                                  |
| ------------ | ------------------------------------------------------------ |
| **Monorepo** | Turborepo（bun）                                             |
| **前端**     | Next.js 19 + React Server Components、TailwindCSS、shadcn/ui |
| **后端/API** | hono                                                         |
| **AI**       | Vercel AI SDK 调用 Gemini Pro（题目生成 & 自检）             |
| **数据库**   | PostgreSQL（Neon Serverless）＋ Drizzle ORM                  |
| **身份认证** | Better Auth — 支持 GitHub OAuth 登录                         |

---

### 3  数据模型

| 表              | 主键                   | 关键字段                                                    | 说明                |
| --------------- | ---------------------- | ----------------------------------------------------------- | ------------------- |
| `users`         | `id`                   | `display_name`, `email`                                     | 由 Better Auth 创建 |
| `organizations` | `id`                   | `name`, `owner_id`, `password`, `description`, `created_at` | 组织                |
| `lectures`      | `id`                   | `title`, `owner_id`, `org_id`, `starts_at`                  | 演讲会话            |
| `materials`     | `id`                   | `lecture_id`, `text_content`                                | 预上传文本          |
| `transcripts`   | `id`                   | `lecture_id`, `ts`, `text`                                  | 实时转录片段        |
| `quiz_items`    | `id`                   | `lecture_id`, `question`, `options[4]`, `answer`, `ts`      | AI 生成题           |
| `attempts`      | *(quiz\_id, user\_id)* | `selected`, `is_correct`, `latency_ms`                      | 听众答题            |

> **统一用户模型与动态角色**
> 
> **核心理念**：每个用户都可以同时扮演多种角色
> - **作为组织者**：创建组织，管理并查看系列演讲集合
> - **作为演讲者**：发起演讲，使用 AI 驱动的问答互动
> - **作为听众**：参与任意公开演讲，进行互动和提问
> 
> **角色判定**：
> - 在自己创建的组织中 → 组织者
> - 在自己创建的讲座中 → 演讲者
> - 在他人的讲座中 → 听众
> 
> **组织（Organization）设计**：
> - 任何用户都可创建组织，成为该组织的管理者
> - 每个组织有唯一密码，演讲者创建讲座时输入密码即可加入
> - 组织管理者可从组织中移除讲座
> - 个人讲座的 `org_id` 为 NULL
> 
> **权限设计**：
> - 演讲者对自己的讲座拥有完全控制权
> - 组织管理者可查看组织内所有讲座的统计数据
> - 组织管理者可移除组织内的讲座

---

### 4  核心流程

1. **组织管理**：
   - 任何用户可创建组织 → 成为组织管理者
   - 设置组织密码，分享给想要加入的演讲者
   - 组织设置名称、描述、密码等基本信息

2. **讲座创建**：
   - 任何用户可创建讲座（owner_id = user_id）
   - 可选择加入组织（输入组织密码）
   - 个人讲座：org_id = NULL
   - 组织讲座：org_id = 所属组织 ID
   - 上传 PPT/PDF/文本，存入 `materials`

3. **实时转录**：演讲开始，前端把麦克风流送往 `/api/transcribe` → Whisper/Gemini 转文字写入 `transcripts`

4. **题目生成**：当演讲者请求生成题目时，自动合并 `materials+transcripts`，调用 AI 产出单题 → 入库 → 推送给同讲座所有前端

5. **答题与反馈**：
   - 听众在 30 s 内提交 → 存 `attempts` → 立即返回结果
   - 演讲者前端订阅统计，实时更新正确率图表
   - 组织创建者可查看组织内所有讲座的汇总统计
