#!/usr/bin/env bun

import { $ } from "bun";
import { writeFileSync } from "fs";
import { join } from "path";

interface GitCommit {
    hash: string;
    author: string;
    message: string;
    date: string;
}

// 成员映射表
const AUTHOR_MAP: Record<string, { name: string; github: string }> = {
    'Arasple': { name: '吴锋', github: 'https://github.com/Arasple' },
    'Fynn': { name: '吴锋', github: 'https://github.com/Arasple' },
    'jq-jz': { name: '蒋琦', github: 'https://github.com/jq-jz' },
    'jq': { name: '蒋琦', github: 'https://github.com/jq-jz' },
    'jiangtang-ruang': { name: '蒋唐', github: 'https://github.com/jiangtang-ruang' },
    'RyurikPashia': { name: '孟轩宇', github: 'https://github.com/PashiaRyurik' },
};

/**
 * 获取作者的显示信息
 */
const getAuthorDisplay = (gitAuthor: string): string => {
    const authorInfo = AUTHOR_MAP[gitAuthor];
    if (authorInfo) {
        return `[来自: ${authorInfo.name}]`;
    }
    return `[来自: ${gitAuthor}]`;
};

/**
 * 获取git远程仓库的GitHub地址
 */
const getGitHubRepoUrl = async (): Promise<string> => {
    try {
        // 获取远程仓库地址
        const remoteUrl = await $`git config --get remote.origin.url`.text();

        // 处理SSH和HTTPS格式的地址
        let repoUrl = remoteUrl.trim();

        if (repoUrl.startsWith('git@github.com:')) {
            // SSH格式: git@github.com:username/repo.git
            repoUrl = repoUrl.replace('git@github.com:', 'https://github.com/');
        }

        if (repoUrl.endsWith('.git')) {
            repoUrl = repoUrl.slice(0, -4);
        }

        return repoUrl;
    } catch (error) {
        console.error('获取远程仓库地址失败:', error);
        return 'https://github.com/unknown/repo';
    }
};

/**
 * 获取今天的git提交记录
 */
const getTodayCommits = async (): Promise<GitCommit[]> => {
    try {
        // 获取今天的日期范围
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // 格式化日期为git可接受的格式
        const sinceDate = todayStart.toISOString().split('T')[0];
        const untilDate = todayEnd.toISOString().split('T')[0];

        // 执行git命令获取提交记录
        const gitOutput = await $`git log --since="${sinceDate}" --until="${untilDate}" --pretty=format:"%H|%an|%s|%ci"`.text();

        if (!gitOutput.trim()) {
            console.log('今天暂无提交记录');
            return [];
        }

        // 解析git输出
        const commits: GitCommit[] = gitOutput
            .trim()
            .split('\n')
            .map(line => {
                const [hash, author, message, date] = line.split('|');
                return {
                    hash: hash.trim(),
                    author: author.trim(),
                    message: message.trim(),
                    date: date.trim()
                };
            });

        return commits;
    } catch (error) {
        console.error('获取提交记录失败:', error);
        return [];
    }
};

/**
 * 生成markdown格式的汇总文件
 */
const generateSummary = async (): Promise<void> => {
    try {
        console.log('正在获取今天的提交记录...');

        const commits = await getTodayCommits();
        const repoUrl = await getGitHubRepoUrl();

        if (commits.length === 0) {
            console.log('今天暂无提交记录，跳过生成汇总文件');
            return;
        }

        // 构建markdown内容
        const today = new Date().toLocaleDateString('zh-CN');
        let markdownContent = `### Git 提交汇总 - ${today}\n\n`;

        commits.forEach(commit => {
            const commitUrl = `${repoUrl}/commit/${commit.hash}`;
            const authorDisplay = getAuthorDisplay(commit.author);
            const line = `- ${authorDisplay} [${commit.message}](${commitUrl})\n`;
            markdownContent += line;
        });

        // 写入文件
        const outputPath = join(process.cwd(), 'sum.md');
        writeFileSync(outputPath, markdownContent, 'utf-8');

        console.log(`✅ 成功生成汇总文件: ${outputPath}`);
        console.log(`📊 共找到 ${commits.length} 条提交记录`);

    } catch (error) {
        console.error('生成汇总文件失败:', error);
        process.exit(1);
    }
};

// 主函数
const main = async () => {
    console.log('🚀 开始生成今日Git提交汇总...');
    await generateSummary();
    console.log('🎉 汇总完成！');
};

// 运行脚本
main().catch(console.error);
