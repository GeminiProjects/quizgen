'use client';

/**
 * 参与演讲标签页
 * 显示用户参与的演讲记录，支持通过演讲码加入新演讲
 */
export default function ParticipationContent() {
  return (
    <div className="space-y-6">
      {/* 页面头部 - 标题和操作按钮在同一行 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl">参与记录</h1>
          <p className="text-muted-foreground">查看您参与的演讲和测评</p>
        </div>
      </div>

      {/* 内容区域 - 待实现 */}
      <div className="text-center text-muted-foreground">
        参与记录功能开发中...
      </div>
    </div>
  );
}
