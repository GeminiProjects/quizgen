'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface QuizNotificationProps {
  lectureId: string;
}

export default function QuizNotification({ lectureId }: QuizNotificationProps) {
  useEffect(() => {
    // TODO: 实现 WebSocket 或 SSE 连接
    // 这里模拟接收推送通知
    const eventSource = new EventSource(
      `/api/quiz-items/notifications/${lectureId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'quiz_pushed') {
        toast.success('有新的测验题目推送', {
          description: '请前往测验参与标签页查看',
          duration: 3000,
        });
      }
    };

    return () => {
      eventSource.close();
    };
  }, [lectureId]);

  return null;
}
