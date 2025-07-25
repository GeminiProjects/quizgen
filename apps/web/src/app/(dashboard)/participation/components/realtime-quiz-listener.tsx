'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { QuizItem } from '@/types';

interface RealtimeQuizListenerProps {
  lectureId: string;
  onNewQuiz: (quiz: QuizItem) => void;
}

export function RealtimeQuizListener({
  lectureId,
  onNewQuiz,
}: RealtimeQuizListenerProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastQuizIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 建立 SSE 连接
    const eventSource = new EventSource(`/api/sse/${lectureId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new_quiz' && data.quiz) {
          const quiz = data.quiz as QuizItem;

          // 避免重复处理同一道题
          if (lastQuizIdRef.current !== quiz.id) {
            lastQuizIdRef.current = quiz.id;
            onNewQuiz(quiz);

            // 播放提示音（如果支持）
            if ('Audio' in window) {
              try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {
                  // 忽略自动播放失败
                });
              } catch {
                // 忽略音频错误
              }
            }

            // 显示通知
            toast.info('收到新题目！', {
              description: '请及时作答',
              duration: 5000,
            });
          }
        }
      } catch (error) {
        console.error('处理SSE消息失败:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      // SSE 会自动重连，不需要手动处理
    };

    eventSource.onopen = () => {
      console.log('题目推送连接已建立');
    };

    // 清理函数
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [lectureId, onNewQuiz]);

  return null; // 这是一个纯逻辑组件，不渲染任何内容
}
