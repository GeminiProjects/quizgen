#!/usr/bin/env bun
import { exec as execCallback, spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import * as readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execCallback);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const envPath = join(rootDir, '.env.local');
const dockerComposePath = join(rootDir, 'docker-compose.yml');

interface EnvConfig {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
  BETTER_AUTH_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  DATABASE_URL: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function prompt(question: string): Promise<string> {
  return await rl.question(question);
}

function generateRandomSecret(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function checkDockerInstalled(): Promise<boolean> {
  try {
    await exec('docker --version');
    return true;
  } catch {
    return false;
  }
}

async function checkDockerRunning(): Promise<boolean> {
  try {
    await exec('docker ps');
    return true;
  } catch {
    return false;
  }
}

async function startLocalDatabase(): Promise<string> {
  console.log('\n🐳 正在启动本地 PostgreSQL 数据库...');

  // 检查 Docker 是否安装
  if (!(await checkDockerInstalled())) {
    console.error(
      '❌ 未检测到 Docker，请先安装 Docker: https://www.docker.com/get-started'
    );
    process.exit(1);
  }

  // 检查 Docker 是否运行
  if (!(await checkDockerRunning())) {
    console.error('❌ Docker 未运行，请先启动 Docker Desktop');
    process.exit(1);
  }

  // 生成随机密码
  const dbPassword = generateRandomSecret();
  const dbUser = 'quizgen';
  const dbName = 'quizgen';

  // 创建 docker-compose.yml（如果不存在）
  if (!existsSync(dockerComposePath)) {
    const dockerComposeContent = `version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: quizgen-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${dbUser}
      POSTGRES_PASSWORD: ${dbPassword}
      POSTGRES_DB: ${dbName}
    ports:
      - "5432:5432"
    volumes:
      - quizgen-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${dbUser}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  quizgen-db-data:
`;
    writeFileSync(dockerComposePath, dockerComposeContent);
    console.log('✅ 已创建 docker-compose.yml');
  }

  // 启动数据库
  try {
    await exec('docker-compose up -d postgres', { cwd: rootDir });
    console.log('⏳ 等待数据库启动...');

    // 等待数据库就绪
    let retries = 30;
    while (retries > 0) {
      try {
        await exec(`docker-compose exec -T postgres pg_isready -U ${dbUser}`, {
          cwd: rootDir,
        });
        console.log('✅ 数据库已成功启动！');
        break;
      } catch {
        retries--;
        if (retries === 0) {
          throw new Error('数据库启动超时');
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return `postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`;
  } catch (error) {
    console.error('❌ 启动数据库失败:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 QuizGen 环境配置向导');
  console.log('========================\n');

  // 检查是否已存在 .env.local 文件
  if (existsSync(envPath)) {
    const overwrite = await prompt('.env.local 文件已存在，是否覆盖？(y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('已取消配置');
      process.exit(0);
    }
  }

  const config: EnvConfig = {
    GOOGLE_GENERATIVE_AI_API_KEY: '',
    BETTER_AUTH_SECRET: '',
    GITHUB_CLIENT_ID: '',
    GITHUB_CLIENT_SECRET: '',
    DATABASE_URL: '',
  };

  // 1. Google API Key (必填)
  console.log('\n📌 Google Gemini API 配置 (必填)');
  console.log('请访问 https://aistudio.google.com/app/apikey 创建 API Key');
  while (!config.GOOGLE_GENERATIVE_AI_API_KEY) {
    config.GOOGLE_GENERATIVE_AI_API_KEY = await prompt(
      '请输入 Google API Key: '
    );
    if (!config.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log('❌ Google API Key 是必填项！');
    }
  }

  // 2. Better Auth Secret (可选，自动生成)
  console.log('\n🔐 Better Auth 配置 (可选)');
  const authSecretInput = await prompt(
    '请输入 Better Auth Secret (留空自动生成): '
  );
  config.BETTER_AUTH_SECRET = authSecretInput || generateRandomSecret();
  if (!authSecretInput) {
    console.log(`✅ 已自动生成 Secret: ${config.BETTER_AUTH_SECRET}`);
  }

  // 3. GitHub OAuth (可选)
  console.log('\n🔑 GitHub OAuth 配置 (可选，用于登录)');
  console.log(
    '如需配置，请访问 https://github.com/settings/developers 创建 OAuth App'
  );
  console.log(
    '回调 URL 设置为: http://localhost:3000/api/auth/callback/github'
  );
  config.GITHUB_CLIENT_ID = await prompt('请输入 GitHub Client ID (可选): ');
  if (config.GITHUB_CLIENT_ID) {
    config.GITHUB_CLIENT_SECRET = await prompt('请输入 GitHub Client Secret: ');
  }

  // 4. 数据库配置
  console.log('\n🗄️  数据库配置');
  const dbUrl = await prompt('请输入数据库 URL (留空将自动启动本地数据库): ');

  if (dbUrl) {
    config.DATABASE_URL = dbUrl;
  } else {
    config.DATABASE_URL = await startLocalDatabase();
  }

  // 写入 .env.local 文件
  const envContent = `# [AI] Google API Key
GOOGLE_GENERATIVE_AI_API_KEY=${config.GOOGLE_GENERATIVE_AI_API_KEY}

# [Auth] Better Auth 认证密钥
BETTER_AUTH_SECRET=${config.BETTER_AUTH_SECRET}

# [Auth] Github OAuth 凭证, 用于账户登录
GITHUB_CLIENT_ID=${config.GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${config.GITHUB_CLIENT_SECRET}

# [Database] 数据库 (Postgres URL)
DATABASE_URL=${config.DATABASE_URL}
`;

  writeFileSync(envPath, envContent);
  console.log('\n✅ 环境配置已完成！');

  // 如果使用本地数据库，执行数据库迁移
  if (!dbUrl) {
    console.log('\n📊 正在初始化数据库...');
    try {
      // 使用 spawn 来支持交互式输入
      const dbPush = spawn('bun', ['db:push'], {
        cwd: rootDir,
        stdio: 'inherit', // 继承父进程的输入输出，允许交互
      });

      await new Promise<void>((resolve, reject) => {
        dbPush.on('close', (code) => {
          if (code === 0) {
            console.log('✅ 数据库迁移完成！');
            resolve();
          } else {
            reject(new Error(`数据库迁移失败，退出码: ${code}`));
          }
        });

        dbPush.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ 数据库迁移失败:', error);
    }
  }

  console.log('\n🎉 配置完成！你可以运行以下命令：');
  console.log('  bun dev          - 启动开发服务器');
  console.log('  bun db:studio    - 打开数据库管理界面');
  console.log('  bun db:stop      - 停止本地数据库（如果使用）');

  rl.close();
}

main().catch(console.error);
