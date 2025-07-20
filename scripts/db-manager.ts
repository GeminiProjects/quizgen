#!/usr/bin/env bun
import { exec as execCallback } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execCallback);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const dockerComposePath = join(rootDir, 'docker-compose.yml');

const commands = {
  start: startDatabase,
  stop: stopDatabase,
  restart: restartDatabase,
  status: checkStatus,
  logs: showLogs,
  clean: cleanDatabase,
};

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

async function startDatabase() {
  console.log('🚀 启动本地数据库...');

  if (!(await checkDockerInstalled())) {
    console.error(
      '❌ 未检测到 Docker，请先安装 Docker: https://www.docker.com/get-started'
    );
    process.exit(1);
  }

  if (!(await checkDockerRunning())) {
    console.error('❌ Docker 未运行，请先启动 Docker Desktop');
    process.exit(1);
  }

  if (!existsSync(dockerComposePath)) {
    console.error('❌ 未找到 docker-compose.yml，请先运行 bun setup');
    process.exit(1);
  }

  try {
    await exec('docker-compose up -d postgres', { cwd: rootDir });
    console.log('⏳ 等待数据库启动...');

    let retries = 30;
    while (retries > 0) {
      try {
        await exec('docker-compose exec -T postgres pg_isready -U quizgen', {
          cwd: rootDir,
        });
        console.log('✅ 数据库已成功启动！');

        // 同时启动 db:studio（在后台运行）
        console.log('\n🎨 启动数据库管理界面...');
        exec('bun db:studio', { cwd: rootDir }).catch(() => {
          console.warn('⚠️  数据库管理界面启动失败');
        });
        // 给 studio 一点启动时间
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log('✅ 数据库管理界面已启动: https://local.drizzle.studio/');

        break;
      } catch {
        retries--;
        if (retries === 0) {
          throw new Error('数据库启动超时');
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  }
}

async function stopDatabase() {
  console.log('🛑 停止本地数据库...');

  try {
    // 停止 db:studio
    await exec('pkill -f "drizzle-kit studio"').catch(() => {
      // ignore
    });

    // 停止数据库
    await exec('docker-compose down', { cwd: rootDir });
    console.log('✅ 数据库已停止');
  } catch (error) {
    console.error('❌ 停止失败:', error);
    process.exit(1);
  }
}

async function restartDatabase() {
  await stopDatabase();
  await startDatabase();
}

async function checkStatus() {
  console.log('🔍 检查数据库状态...\n');

  try {
    const { stdout } = await exec('docker-compose ps', { cwd: rootDir });
    console.log(stdout);

    try {
      await exec('docker-compose exec -T postgres pg_isready -U quizgen', {
        cwd: rootDir,
      });
      console.log('\n✅ 数据库运行正常');
    } catch {
      console.log('\n⚠️  数据库容器已启动但尚未就绪');
    }
  } catch {
    console.log('❌ 数据库未运行');
  }
}

async function showLogs() {
  console.log('📜 显示数据库日志...\n');

  try {
    const { stdout } = await exec('docker-compose logs --tail=50 postgres', {
      cwd: rootDir,
    });
    console.log(stdout);
  } catch {
    console.error('❌ 无法获取日志');
  }
}

async function cleanDatabase() {
  console.log('🗑️  清理数据库数据...');

  const readline = await import('node:readline/promises');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const confirm = await rl.question(
    '⚠️  此操作将删除所有数据库数据，是否继续？(y/N): '
  );
  rl.close();

  if (confirm.toLowerCase() !== 'y') {
    console.log('已取消操作');
    return;
  }

  try {
    await exec('docker-compose down -v', { cwd: rootDir });
    console.log('✅ 数据库数据已清理');
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

async function main() {
  const command = process.argv[2];

  if (!(command && commands[command as keyof typeof commands])) {
    console.log(`
🗄️  QuizGen 数据库管理工具

使用方法:
  bun db:start    - 启动本地数据库和管理界面
  bun db:stop     - 停止数据库
  bun db:restart  - 重启数据库
  bun db:status   - 查看数据库状态
  bun db:logs     - 查看数据库日志
  bun db:clean    - 清理数据库数据（危险操作）
`);
    process.exit(0);
  }

  await commands[command as keyof typeof commands]();
}

main().catch(console.error);
