'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getLatestQuiz } from '@/app/actions/participation';
import type { QuizItem } from '@/types';

interface RealtimeQuizListenerProps {
  lectureId: string;
  onNewQuiz: (quiz: QuizItem) => void;
  pollInterval?: number;
}

export function RealtimeQuizListener({
  lectureId,
  onNewQuiz,
  pollInterval = 3000, // 默认3秒轮询一次
}: RealtimeQuizListenerProps) {
  const [isPolling, setIsPolling] = useState(true);
  const [lastQuizId, setLastQuizId] = useState<string | undefined>(undefined);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const checkForNewQuiz = useCallback(async () => {
    if (!isPolling) {
      return;
    }

    try {
      const result = await getLatestQuiz(lectureId, lastQuizId);

      if (result.success && result.data) {
        const newQuiz = result.data;
        setLastQuizId(newQuiz.id);
        onNewQuiz(newQuiz);

        // 播放提示音（如果支持）
        // if ('Audio' in window) {
        //   try {
        //     const audio = new Audio('/notification.mp3');
        //     audio.volume = 0.5;
        //     audio.play().catch(() => {
        //       // 忽略自动播放失败
        //     });
        //   } catch {
        //     // 忽略音频错误
        //   }
        // }

        // 显示通知
        toast.info('收到新题目！', {
          description: '请及时作答',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('获取最新题目失败:', error);
    }
  }, [lectureId, lastQuizId, onNewQuiz, isPolling]);

  useEffect(() => {
    if (!isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // 立即检查一次
    checkForNewQuiz();

    // 设置定时轮询
    intervalRef.current = setInterval(checkForNewQuiz, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkForNewQuiz, pollInterval, isPolling]);

  // 页面可见性变化时暂停/恢复轮询
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPolling(false);
      } else {
        setIsPolling(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // 这是一个纯逻辑组件，不渲染任何内容
}
