---
args:
  period:
    description: "时间范围"
description: 生成指定时间范围的 Git 提交历史报告
---

## 上下文

- 远程仓库 URL: !`git remote get-url origin`

## 任务描述

生成一个格式化的 Git 提交历史列表，并保存到项目根目录的 `.git-sum.md` 文件。

- 使用参数 {{period}} 来确定时间范围
- 将 Github Username 映射到真实姓名

映射表:
```
[Arasple, Fynn], 吴锋 (https://github.com/Arasple)
[jq-jz], 蒋琦 (https://github.com/jq-jz)
[jiangtang-ruang], 蒋唐 (https://github.com/jiangtang-ruang)
[PashiaRyurik], 孟轩宇 (https://github.com/PashiaRyurik)
```

- `来自: [真实姓名](GitHub链接) - [提交消息](GitHub提交链接) ~ (修改统计信息)`

## 示例输出

```markdown
- 来自: [吴锋](https://github.com/Arasple) - [fix: lint errors](https://github.com/GeminiProjects/quizgen/commit/f112920) ~ (2 files changed, 15 insertions(+), 8 deletions(-))
- 来自: [蒋唐](https://github.com/jiangtang-ruang) - [feat: add dark mode support](https://github.com/GeminiProjects/quizgen/commit/abc1234) ~ (5 files changed, 120 insertions(+), 30 deletions(-))