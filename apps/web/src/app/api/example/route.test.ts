import { describe, expect, it } from 'bun:test';
import { GET } from './route';

describe('GET /api/example', () => {
  it('应该返回正确的 JSON 响应', async () => {
    // 调用 GET 处理函数
    const response = await GET();

    // 验证响应状态
    expect(response.status).toBe(200);

    // 验证响应内容类型
    expect(response.headers.get('content-type')).toContain('application/json');

    // 验证响应体
    const data = await response.json();
    expect(data).toEqual({ message: 'Hello, world!' });
  });

  it('应该在执行前有 1 秒延迟', async () => {
    // 记录开始时间
    const startTime = Date.now();

    // 执行请求
    await GET();

    // 记录结束时间
    const endTime = Date.now();
    const duration = endTime - startTime;

    // 验证延迟时间（考虑到执行时间，设置为 900ms 以上）
    expect(duration).toBeGreaterThanOrEqual(900);
  });
});
