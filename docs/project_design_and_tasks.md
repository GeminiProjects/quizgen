## QuizGen 项目设计文档

> **目标**：用最少可行功能（MVP）实现“演讲实时出题-答题-反馈”的闭环，供课堂/公开演讲快速试用。

---

### 1  项目简介

QuizGen 帮助演讲者在讲述过程中，自动生成四选一选择题并推送给听众。  
听众答题后立即获知对错，而演讲者可同步看到全场正确率，从而判断讲述节奏和理解度。

---

### 2  技术栈

| 层次         | 选型 & 说明                                                  |
| ------------ | ------------------------------------------------------------ |
| **Monorepo** | Turborepo（bun）                                             |
| **前端**     | Next.js 19 + React Server Components、TailwindCSS、shadcn/ui |
| **后端/API** | hono（运行于 Bun）                                           |
| **AI**       | Vercel AI SDK 调用 Gemini Pro（题目生成 & 自检）             |
| **数据库**   | PostgreSQL（Neon Serverless）＋ Drizzle ORM                  |
| **身份认证** | Better Auth — 支持 GitHub OAuth 登录                         |

---

### 3  数据模型

| 表            | 主键                   | 关键字段                                               | 说明                |
| ------------- | ---------------------- | ------------------------------------------------------ | ------------------- |
| `users`       | `id`                   | `display_name`, `email`                                | 由 Better Auth 创建 |
| `lectures`    | `id`                   | `title`, `owner_id`, `starts_at`                       | 演讲会话            |
| `materials`   | `id`                   | `lecture_id`, `text_content`                           | 预上传文本          |
| `transcripts` | `id`                   | `lecture_id`, `ts`, `text`                             | 实时转录片段        |
| `quiz_items`  | `id`                   | `lecture_id`, `question`, `options[4]`, `answer`, `ts` | AI 生成题           |
| `attempts`    | *(quiz\_id, user\_id)* | `selected`, `is_correct`, `latency_ms`                 | 听众答题            |

> **动态角色**
> *“听众”* 为默认角色；`owner_id == users.id` 的用户在其讲座中天然拥有“演讲者”权限；同一用户可在不同讲座扮演不同角色，无需额外快照表。

---

### 4  核心流程

1. **讲座创建**：用户登录 → 创建 Lecture → 上传 PPT/PDF/文本，存入 `materials`。
2. **实时转录**：演讲开始，前端把麦克风流送往 `/api/transcribe` → Whisper/Gemini 转文字写入 `transcripts`。
3. **题目生成**：当演讲者请求生成题目时，自动合并 `materials+transcripts`，调用 AI 产出单题 → 入库 → 推送给同讲座所有前端。
4. **答题与反馈**：听众在 30 s 内提交 → 存 `attempts` → 立即返回结果；演讲者前端订阅统计，实时更新正确率图表。

---

### 5  任务拆分

#### 环境 & 基础

* [x] 初始化 **turborepo**：`apps/web`、`apps/api`、`packages/ui`、`packages/db`
* [x] 配置 **PostgreSQL + Drizzle**，生成上述六张核心表
* [ ] 集成 **Better Auth**, 实现 Github 登录

  * [ ] 后端：hono middleware 校验会话
  * [ ] 前端：`useAuth()` 获取 `user`

#### 文件与转录

* [ ] 实现 `/api/materials/upload` —— 接收文件 → 提取文字 → 存 `materials`
* [ ] 集成 Whisper/Gemini 语音转文字服务

  * [ ] 前端录音组件（MediaRecorder → fetch stream）
  * [ ] `/api/transcribe` 接口写 `transcripts`

#### AI 题目生成

* [ ] 写 `packages/ai/generateQuiz.ts`：

  * [ ] 读取最近 N 分钟 `transcripts` + `materials`
  * [ ] 调用 Gemini prompt → 返回 {question, options\[], answer}
  * [ ] 自检：确保 4 个选项、唯一答案
* [ ] cron/worker 每 10 min 运行；写入 `quiz_items`

#### 实时推送

* [ ] 在 hono 建立 `/ws`：按 `lecture_id` 分房
* [ ] 题目入库后发送 `QUIZ_READY` 事件
* [ ] 答题后发送 `STATS_UPDATE`

#### 前端页面

* [ ] **听众视图** `/lecture/[id]`

  * [ ] QuestionPanel＋TimerBar
  * [ ] 答题后显示对/错并隐藏正确选项
* [ ] **演讲者视图** `/lecture/[id]/speaker`

  * [ ] 列出当前题 & 全场正确率（简单饼图/计数即可）
* [ ] **DashBoard** `/` — 我创建/参与的讲座列表

#### 统计

* [ ] `/api/stats/:lectureId`：聚合 `attempts` 返回正确率、平均答题时长
* [ ] 前端定时/WS 渲染
