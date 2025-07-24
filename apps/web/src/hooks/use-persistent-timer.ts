'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface TimerState {
  quizId: string;
  startTime: number; // 时间戳
  timeLimit: number; // 秒
}

interface UsePersistentTimerProps {
  quizId: string;
  timeLimit?: number;
  onTimeUp?: () => void;
}

/**
 * 持久化倒计时 Hook
 * 即使用户切换标签页，倒计时也会继续进行
 */
export function usePersistentTimer({
  quizId,
  timeLimit = 30,
  onTimeUp,
}: UsePersistentTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStateKey = `quiz_timer_${quizId}`;

  // 保存计时器状态到 localStorage
  const saveTimerState = useCallback(
    (startTime: number) => {
      const timerState: TimerState = {
        quizId,
        startTime,
        timeLimit,
      };
      localStorage.setItem(timerStateKey, JSON.stringify(timerState));
    },
    [quizId, timeLimit, timerStateKey]
  );

  // 从 localStorage 恢复计时器状态
  const restoreTimerState = useCallback((): TimerState | null => {
    try {
      const savedState = localStorage.getItem(timerStateKey);
      return savedState ? JSON.parse(savedState) : null;
    } catch {
      return null;
    }
  }, [timerStateKey]);

  // 清除计时器状态
  const clearTimerState = useCallback(() => {
    localStorage.removeItem(timerStateKey);
  }, [timerStateKey]);

  // 初始化计时器
  const initTimer = useCallback(() => {
    const savedState = restoreTimerState();

    // 如果有保存的状态且是同一个题目，恢复计时器
    if (savedState && savedState.quizId === quizId) {
      const elapsed = Math.floor((Date.now() - savedState.startTime) / 1000);
      const remaining = Math.max(0, savedState.timeLimit - elapsed);

      if (remaining > 0) {
        setTimeRemaining(remaining);
        saveTimerState(savedState.startTime); // 重新保存以更新时间
        return savedState.startTime;
      }
      // 时间已到
      setTimeRemaining(0);
      setIsTimeUp(true);
      clearTimerState();
      onTimeUp?.();
      return null;
    }
    // 新题目，开始新的计时器
    const startTime = Date.now();
    setTimeRemaining(timeLimit);
    saveTimerState(startTime);
    return startTime;
  }, [
    quizId,
    timeLimit,
    restoreTimerState,
    saveTimerState,
    clearTimerState,
    onTimeUp,
  ]);

  // 开始计时器
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const startTime = initTimer();
    if (!startTime || isTimeUp) {
      return;
    }

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        setIsTimeUp(true);
        clearTimerState();
        onTimeUp?.();
      }
    }, 1000);
  }, [initTimer, timeLimit, isTimeUp, clearTimerState, onTimeUp]);

  // 重置计时器
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimeRemaining(timeLimit);
    setIsTimeUp(false);
    clearTimerState();
  }, [timeLimit, clearTimerState]);

  // 设置新的题目计时器
  const setQuizTimer = useCallback(
    (_newQuizId: string) => {
      resetTimer();
      // 更新 quizId 后会触发重新初始化
    },
    [resetTimer]
  );

  useEffect(() => {
    startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTimer]);

  return {
    timeRemaining,
    isTimeUp,
    resetTimer,
    setQuizTimer,
  };
}
