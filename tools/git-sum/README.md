# Git 提交汇总工具

基于 Bun 运行时的 Git 提交记录汇总工具，用于生成今日提交记录的 Markdown 汇总文件。

## 功能特性

- 📊 **自动获取今天的提交记录** - 过滤出当天的所有提交
- 👤 **智能作者映射** - 将Git作者名映射为真实姓名和GitHub链接
- 🔗 **生成GitHub链接** - 自动构建指向GitHub提交页面的链接
- 📝 **Markdown格式输出** - 生成格式化的汇总文件
- ⚡ **基于Bun运行时** - 快速执行，性能优异

## 使用方法

### 1. 安装依赖

```bash
cd tools/git-sum
bun install
```

### 2. 运行脚本

```bash
# 方式一：直接运行
bun run index.ts

# 方式二：使用脚本命令
bun start

# 方式三：从项目根目录运行
bun run tools/git-sum/index.ts
```

### 3. 查看结果

脚本会在项目根目录生成 `sum.md` 文件，包含今日的提交汇总。

## 输出格式

生成的 `sum.md` 文件格式如下：

```markdown
### Git 提交汇总 - 2024/1/15

- [来自: [吴锋](https://github.com/Arasple)] [添加用户认证功能](https://github.com/username/repo/commit/abc123)
- [来自: [蒋琦](https://github.com/jq-jz)] [修复登录页面样式问题](https://github.com/username/repo/commit/def456)
- [来自: [蒋唐](https://github.com/jiangtang-ruang)] [优化数据库查询性能](https://github.com/username/repo/commit/ghi789)
```

## 成员映射表

脚本内置了团队成员的映射表，将Git作者名映射为真实姓名和GitHub链接：

| Git作者名       | 真实姓名 | GitHub链接                         |
| :-------------- | :------- | :--------------------------------- |
| Arasple         | 吴锋     | https://github.com/Arasple         |
| jq-jz           | 蒋琦     | https://github.com/jq-jz           |
| jiangtang-ruang | 蒋唐     | https://github.com/jiangtang-ruang |
| PashiaRyurik    | 孟轩宇   | https://github.com/PashiaRyurik    |

对于未在映射表中的作者，将直接显示Git作者名。

## 技术实现

- **运行时**: Bun
- **语言**: TypeScript
- **依赖**: 仅使用Bun内置模块
- **Git集成**: 通过命令行调用git命令
- **日期过滤**: 基于本地时区的今日范围

## 注意事项

- 确保在Git项目根目录或子目录中运行
- 需要配置正确的Git远程仓库地址
- 支持SSH和HTTPS两种GitHub地址格式
- 如果今天没有提交记录，将跳过文件生成
- 新增团队成员时，需要在脚本中更新 `AUTHOR_MAP` 映射表

## 错误处理

脚本包含完善的错误处理机制：
- Git命令执行失败时的降级处理
- 远程仓库地址获取失败时的默认值
- 日期解析异常的容错处理 