# 贡献指南

感谢你对 QuizGen 项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告问题
- 💡 提出新功能建议  
- 📝 改进文档
- 🔧 提交代码修复
- ✨ 添加新功能

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
  - [报告问题](#报告问题)
  - [提出功能建议](#提出功能建议)
  - [贡献代码](#贡献代码)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [项目结构](#项目结构)
- [常见问题](#常见问题)

## 行为准则

### 我们的承诺

我们致力于为每个人提供一个开放和友好的环境。作为贡献者和维护者，我们承诺：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性的批评
- 专注于对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性别化语言或图像，以及不受欢迎的性关注或挑逗
- 恶意评论、侮辱/贬损性评论以及个人或政治攻击
- 公开或私下骚扰
- 未经明确许可，发布他人的私人信息
- 其他在专业环境中被合理认为不适当的行为

## 如何贡献

### 报告问题

发现 Bug？请通过 [GitHub Issues](https://github.com/GeminiProjects/quizgen/issues) 报告问题。

**在创建 Issue 之前**：
1. 搜索现有 Issues，避免重复
2. 确认问题可以复现
3. 收集必要的信息

**Issue 应包含**：
- 清晰的标题和描述
- 复现步骤
- 预期行为和实际行为
- 截图（如果适用）
- 环境信息（操作系统、浏览器版本等）

### 提出功能建议

有好的想法？我们很乐意听到！

**功能建议应包含**：
- 功能的用例场景
- 为什么这个功能对项目有价值
- 可能的实现方案（可选）

### 贡献代码

#### 1. 准备工作

```bash
# Fork 项目到你的 GitHub 账号

# Clone 你的 fork
git clone https://github.com/YOUR_USERNAME/quizgen.git
cd quizgen

# 添加上游仓库
git remote add upstream https://github.com/GeminiProjects/quizgen.git

# 安装依赖
bun install

# 创建功能分支
git checkout -b feature/your-feature-name
```

#### 2. 开发环境设置

```bash
# 运行配置向导
bun setup

# 启动开发服务器
bun dev

# 运行类型检查和代码检查
bun check

# 格式化代码
bun format
```

## 开发流程

### 1. 分支命名规范

- `feature/` - 新功能
- `fix/` - Bug 修复
- `docs/` - 文档改进
- `refactor/` - 代码重构
- `test/` - 测试相关
- `chore/` - 构建过程或辅助工具的变动

示例：
- `feature/add-export-function`
- `fix/quiz-submission-error`
- `docs/improve-api-documentation`

### 2. 开发步骤

1. **保持代码同步**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature
   ```

3. **编写代码**
   - 遵循项目的代码规范
   - 编写清晰的注释
   - 添加必要的测试

4. **运行检查**
   ```bash
   # 类型检查和代码检查
   cd apps/web && bun check
   
   # 格式化代码
   cd ../.. && bun format
   ```

5. **提交更改**
   - 使用清晰的提交信息
   - 遵循提交规范

## 代码规范

### TypeScript 规范

```typescript
// ✅ 好的实践
import type { User } from '@/types';

export async function getUser(id: string): Promise<User | null> {
  // 实现
}

// ❌ 避免
import { User } from '@/types'; // 应使用 import type

export async function getUser(id: any) { // 避免使用 any
  // 实现
}
```

### React 组件规范

```typescript
// ✅ 好的实践
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Server Actions 规范

```typescript
'use server';

import { requireAuth } from '@/lib/auth';
import { createLectureSchema } from '@/lib/schemas';
import type { ActionResult, Lecture } from '@/types';

export async function createLecture(
  input: CreateLectureInput
): Promise<ActionResult<Lecture>> {
  try {
    // 1. 身份验证
    const session = await requireAuth();
    
    // 2. 参数验证
    const validated = createLectureSchema.parse(input);
    
    // 3. 业务逻辑
    const lecture = await db.insert(...);
    
    // 4. 重新验证缓存
    revalidatePath('/lectures');
    
    // 5. 返回结果
    return { success: true, data: lecture };
  } catch (error) {
    return handleActionError(error);
  }
}
```

### 样式规范

使用 TailwindCSS 的语义化类名：

```typescript
// ✅ 好的实践
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-sm">
  <Icon className="h-5 w-5 text-primary" />
  <span className="text-lg font-medium">标题</span>
</div>

// ❌ 避免
<div style={{ display: 'flex', padding: '24px' }}>
  {/* 避免内联样式 */}
</div>
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新增功能，也不是修复 bug）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
# 新功能
git commit -m "feat(quiz): 添加批量生成测验功能"

# Bug 修复
git commit -m "fix(auth): 修复匿名用户无法参与演讲的问题"

# 文档
git commit -m "docs: 更新 API 文档中的示例代码"

# 包含详细说明的提交
git commit -m "feat(lectures): 实现演讲录制功能

- 添加录制开始/停止按钮
- 实现音频上传到云存储
- 自动生成转录文本

Closes #123"
```

## Pull Request 流程

### 1. 创建 Pull Request

1. 推送你的分支到 GitHub
   ```bash
   git push origin feature/your-feature
   ```

2. 在 GitHub 上创建 Pull Request

3. 填写 PR 模板，包含：
   - 变更描述
   - 相关 Issue（如果有）
   - 测试方法
   - 截图（如果是 UI 变更）

### 2. PR 标题格式

遵循提交信息的格式：
- `feat: 添加导出功能`
- `fix: 修复演讲列表分页问题`
- `docs: 完善部署文档`

### 3. 代码审查

- PR 需要至少一位维护者的审查
- 根据反馈进行修改
- 保持 PR 聚焦于单一目标

### 4. 合并要求

- 所有 CI 检查通过
- 代码审查通过
- 没有冲突
- 测试覆盖新功能

## 项目结构

```
quizgen/
├── apps/
│   └── web/                    # Next.js 应用
│       ├── src/
│       │   ├── app/           # 页面和路由
│       │   │   ├── actions/   # Server Actions
│       │   │   └── api/       # API 路由
│       │   ├── components/    # React 组件
│       │   ├── hooks/         # 自定义 Hooks
│       │   ├── lib/           # 工具函数
│       │   └── types.ts       # 类型定义
│       └── public/            # 静态资源
├── packages/
│   ├── ai/                    # AI 功能封装
│   ├── auth/                  # 认证模块
│   ├── db/                    # 数据库层
│   └── ui/                    # UI 组件库
└── docs/                      # 项目文档
```

### 重要文件

- `CLAUDE.md` - AI 助手的项目指南
- `turbo.json` - Turborepo 配置
- `biome.json` - 代码检查和格式化配置
- `.env.example` - 环境变量示例

## 常见问题

### Q: 如何运行测试？

```bash
bun test
```

### Q: 如何更新数据库架构？

```bash
# 生成迁移
bun db:generate

# 应用迁移
bun db:push
```

### Q: 如何解决依赖冲突？

```bash
# 清理并重新安装
bun clean
bun install --no-cache
```

### Q: 如何调试 Server Actions？

在 Server Actions 中使用 `console.log`，日志会显示在终端：

```typescript
export async function myAction() {
  console.log('调试信息');
  // ...
}
```

### Q: 代码检查失败怎么办？

```bash
# 自动修复大部分问题
bun format

# 查看具体错误
cd apps/web && bun check
```

## 获得帮助

- 📧 Email: support@quizgen.example.com
- 💬 Discussions: [GitHub Discussions](https://github.com/GeminiProjects/quizgen/discussions)
- 🐛 Issues: [GitHub Issues](https://github.com/GeminiProjects/quizgen/issues)

## 许可证

通过贡献代码，你同意你的贡献将按照项目的 [MIT 许可证](LICENSE) 进行许可。

---

再次感谢你的贡献！让我们一起把 QuizGen 做得更好。 🎉