import { Hono } from 'hono';
import { cors } from 'hono/cors';

// 创建 Hono 应用实例
const app = new Hono();

// 启用 CORS
app.use('/*', cors());

// 根路由
app.get('/', (c) => {
  return c.json({
    message: '欢迎使用 QuizGen API',
    version: '0.0.1',
    timestamp: new Date().toISOString(),
  });
});

// 健康检查路由
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API 路由示例
app.get('/api/hello', (c) => {
  const name = c.req.query('name') || 'World';
  return c.json({
    message: `Hello, ${name}!`,
  });
});

// POST 路由示例
app.post('/api/echo', async (c) => {
  const body = await c.req.json();
  return c.json({
    echo: body,
    timestamp: new Date().toISOString(),
  });
});

// 404 处理
app.notFound((c) => {
  return c.json(
    {
      error: '路由未找到',
      path: c.req.path,
    },
    404
  );
});

// 错误处理
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json(
    {
      error: '服务器内部错误',
      message: err.message,
    },
    500
  );
});

// 导出为 Cloudflare Worker
export default app;
