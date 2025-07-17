/**
 * Cloudflare Workers 入口文件
 * 使用 Hono 框架构建 API
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// 定义环境变量类型
type Bindings = {
  // 数据库连接字符串
  DATABASE_URL: string;
  // 其他环境变量可以在这里添加
};

// 创建 Hono 应用实例
const app = new Hono<{ Bindings: Bindings }>();

// 全局中间件
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*', // 开发环境允许所有来源，生产环境应该限制
    credentials: true,
  })
);

// 健康检查端点
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'QuizGen API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 处理
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.path} not found`,
    },
    404
  );
});

// 全局错误处理
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

// 导出 Workers 处理器
export default app;
