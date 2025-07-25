#!/usr/bin/env bun
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';

// 用户名映射表
const userNameMap: Record<string, string> = {
  Fynn: '吴锋',
  Arasple: '吴锋',
  RyurikPashia: '孟轩宇',
  PashiaRyurik: '孟轩宇',
  jq: '蒋琦',
  蒋唐: '蒋唐',
};

interface CommitInfo {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  additions: number;
  deletions: number;
  filesChanged: number;
}

interface AuthorStats {
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
  firstCommit: string;
  lastCommit: string;
}

async function getGitHistory(): Promise<CommitInfo[]> {
  const format = '%H|%an|%ae|%aI|%s';
  const result = await $`git log --format="${format}"`.text();

  const lines = result.split('\n').filter((line) => line.trim());
  const commits: CommitInfo[] = [];

  for (const line of lines) {
    const [hash, author, email, date, ...messageParts] = line.split('|');
    const message = messageParts.join('|');

    // 过滤掉 Merge 提交
    if (message.toLowerCase().startsWith('merge')) {
      continue;
    }

    // 获取每个提交的详细统计
    const statResult = await $`git show --numstat --format="" ${hash}`.text();
    const statLines = statResult.split('\n').filter((l) => l.trim());

    let additions = 0;
    let deletions = 0;
    let filesChanged = 0;

    for (const statLine of statLines) {
      const parts = statLine.split('\t');
      if (parts.length >= 3) {
        const [add, del] = parts;
        if (add !== '-' && del !== '-') {
          additions += Number.parseInt(add, 10) || 0;
          deletions += Number.parseInt(del, 10) || 0;
          filesChanged++;
        }
      }
    }

    commits.push({
      hash,
      author,
      email,
      date,
      message,
      additions,
      deletions,
      filesChanged,
    });
  }

  return commits;
}

async function getRepoInfo() {
  const repoName = await $`basename $(git rev-parse --show-toplevel)`.text();
  const branch = await $`git branch --show-current`.text();
  const remoteUrl =
    await $`git remote get-url origin 2>/dev/null || echo "无远程仓库"`.text();
  const totalCommits = await $`git rev-list --count HEAD`.text();
  const firstCommit =
    await $`git log --reverse --format="%aI" | head -1`.text();
  const lastCommit = await $`git log -1 --format="%aI"`.text();

  return {
    repoName: repoName.trim(),
    branch: branch.trim(),
    remoteUrl: remoteUrl.trim(),
    totalCommits: Number.parseInt(totalCommits.trim(), 10),
    firstCommit: firstCommit.trim(),
    lastCommit: lastCommit.trim(),
  };
}

async function getFileStats() {
  const files = await $`git ls-tree -r HEAD --name-only`.text();
  const fileList = files
    .trim()
    .split('\n')
    .filter((f) => f);

  const extensions: Record<string, number> = {};
  let totalLines = 0;

  // 获取所有文本文件的行数（更高效的方法）
  const textFiles = fileList.filter((f) => {
    const ext = f.split('.').pop() || '';
    return [
      'ts',
      'tsx',
      'js',
      'jsx',
      'json',
      'md',
      'mdc',
      'yml',
      'yaml',
      'txt',
      'css',
      'scss',
    ].includes(ext);
  });

  if (textFiles.length > 0) {
    try {
      const result =
        await $`cat ${textFiles.join(' ')} 2>/dev/null | wc -l`.text();
      totalLines = Number.parseInt(result.trim(), 10) || 0;
    } catch {
      // 如果批量处理失败，逐个文件处理
      for (const file of textFiles) {
        try {
          const lines = await $`wc -l < "${file}" 2>/dev/null`.text();
          totalLines += Number.parseInt(lines.trim(), 10) || 0;
        } catch {
          // 忽略文件读取错误
        }
      }
    }
  }

  for (const file of fileList) {
    const ext = file.split('.').pop() || 'no-ext';
    extensions[ext] = (extensions[ext] || 0) + 1;
  }

  return {
    totalFiles: fileList.length,
    totalLines,
    extensions: Object.entries(extensions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
  };
}

async function generateReport() {
  console.log('🔍 正在分析 Git 历史...');

  console.log('📊 获取仓库信息...');
  const repoInfo = await getRepoInfo();

  console.log('📈 获取文件统计...');
  const fileStats = await getFileStats();

  console.log('📝 获取提交历史（可能需要一些时间）...');
  const commits = await getGitHistory();

  // 计算贡献者统计（按姓名合并）
  const authorStats = new Map<string, AuthorStats>();

  for (const commit of commits) {
    const realName = userNameMap[commit.author] || commit.author;
    const key = realName; // 使用姓名作为 key 来合并相同姓名的贡献者

    if (!authorStats.has(key)) {
      authorStats.set(key, {
        name: realName,
        email: commit.email,
        commits: 0,
        additions: 0,
        deletions: 0,
        firstCommit: commit.date,
        lastCommit: commit.date,
      });
    }

    const stats = authorStats.get(key);
    if (stats) {
      stats.commits++;
      stats.additions += commit.additions;
      stats.deletions += commit.deletions;

      // 更新时间范围
      if (new Date(commit.date) < new Date(stats.firstCommit)) {
        stats.firstCommit = commit.date;
      }
      if (new Date(commit.date) > new Date(stats.lastCommit)) {
        stats.lastCommit = commit.date;
      }
    }
  }

  // 生成报告
  let report = `# Git 项目开发历史报告

## 项目信息
- **项目名称**: ${repoInfo.repoName}
- **当前分支**: ${repoInfo.branch}
- **远程仓库**: ${repoInfo.remoteUrl}
- **总提交数**: ${repoInfo.totalCommits}
- **首次提交**: ${new Date(repoInfo.firstCommit).toLocaleString('zh-CN')}
- **最新提交**: ${new Date(repoInfo.lastCommit).toLocaleString('zh-CN')}

## 代码统计
- **文件总数**: ${fileStats.totalFiles}
- **代码总行数**: ${fileStats.totalLines.toLocaleString()}

### 主要文件类型
${fileStats.extensions.map(([ext, count]) => `- .${ext}: ${count} 个文件`).join('\n')}

## 贡献者统计

| 贡献者 | 提交数 | 新增行 | 删除行 | 总变更行 | 首次贡献 | 最后贡献 |
|--------|--------|--------|--------|----------|----------|----------|
`;

  const sortedAuthors = Array.from(authorStats.values()).sort(
    (a, b) => b.commits - a.commits
  );

  for (const author of sortedAuthors) {
    const totalChanges = author.additions + author.deletions;
    const firstDate = new Date(author.firstCommit).toLocaleDateString('zh-CN');
    const lastDate = new Date(author.lastCommit).toLocaleDateString('zh-CN');

    report += `| ${author.name} | ${author.commits} | +${author.additions.toLocaleString()} | -${author.deletions.toLocaleString()} | ${totalChanges.toLocaleString()} | ${firstDate} | ${lastDate} |\n`;
  }

  // 添加开发活跃度分析
  report += '\n## 开发活跃度分析\n\n';

  // 按星期统计
  const commitsByDayOfWeek = new Array(7).fill(0);
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  for (const commit of commits) {
    const dayOfWeek = new Date(commit.date).getDay();
    commitsByDayOfWeek[dayOfWeek]++;
  }

  report += '### 按星期统计\n';
  commitsByDayOfWeek.forEach((count, day) => {
    const percentage = ((count / commits.length) * 100).toFixed(1);
    report += `- ${dayNames[day]}: ${count} 次提交 (${percentage}%)\n`;
  });

  // 按小时统计
  const commitsByHour = new Array(24).fill(0);

  for (const commit of commits) {
    const hour = new Date(commit.date).getHours();
    commitsByHour[hour]++;
  }

  report += '\n### 最活跃时段\n';
  const topHours = commitsByHour
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  topHours.forEach(({ hour, count }) => {
    const percentage = ((count / commits.length) * 100).toFixed(1);
    report += `- ${hour}:00-${hour + 1}:00: ${count} 次提交 (${percentage}%)\n`;
  });

  report += '\n## 提交历史详情\n\n';

  // 按月份分组提交
  const commitsByMonth = new Map<string, CommitInfo[]>();

  for (const commit of commits) {
    const date = new Date(commit.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!commitsByMonth.has(monthKey)) {
      commitsByMonth.set(monthKey, []);
    }
    const monthCommits = commitsByMonth.get(monthKey);
    if (monthCommits) {
      monthCommits.push(commit);
    }
  }

  // 按月份输出
  const sortedMonths = Array.from(commitsByMonth.keys()).sort().reverse();

  for (const month of sortedMonths) {
    const monthCommits = commitsByMonth.get(month);
    if (!monthCommits) {
      continue;
    }

    const [year, monthNum] = month.split('-');

    report += `\n### ${year}年${Number.parseInt(monthNum, 10)}月 (${monthCommits.length} 次提交)\n\n`;

    for (const commit of monthCommits) {
      const realName = userNameMap[commit.author] || commit.author;
      const date = new Date(commit.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      report += `**[${dateStr}] ${realName}** - ${commit.message}\n`;
      report += `- 提交哈希: \`${commit.hash.substring(0, 7)}\`\n\n`;
    }
  }

  // 写入文件
  const outputPath = join(process.cwd(), 'git.md');
  writeFileSync(outputPath, report, 'utf-8');

  console.log(`\n✅ Git 历史报告已生成: ${outputPath}`);
  console.log('\n📊 统计概要:');
  console.log(`- 总提交数: ${commits.length}`);
  console.log(`- 贡献者数: ${authorStats.size}`);
  console.log(
    `- 项目时长: ${Math.ceil((new Date(repoInfo.lastCommit).getTime() - new Date(repoInfo.firstCommit).getTime()) / (1000 * 60 * 60 * 24))} 天`
  );
}

// 运行脚本
generateReport().catch(console.error);
