'use client';

/**
 * 演讲管理标签页
 * 显示用户创建的演讲列表，支持创建、管理演讲
 */
export default function LecturesContent() {
  return (
    <div className="space-y-6">
      {/* 页面头部 - 标题和操作按钮在同一行 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl">我的演讲</h1>
          <p className="text-muted-foreground">管理您创建的演讲会话</p>
        </div>
      </div>

      {/* 内容区域 - 待实现 */}
      <div className="text-center text-muted-foreground">
        演讲管理功能开发中...
      </div>
    </div>
  );
}
