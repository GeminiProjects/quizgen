'use client';

import { useCallback, useEffect, useState } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): [T, (value: SetValue<T>) => void, () => void] {
  const serialize = useCallback(
    (value: T) => (options?.serialize || JSON.stringify)(value),
    [options?.serialize]
  );
  const deserialize = useCallback(
    (value: string) => (options?.deserialize || JSON.parse)(value),
    [options?.deserialize]
  );

  // 使用初始值，避免 hydration 问题
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 在客户端 hydration 后从 localStorage 读取值
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(deserialize(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, deserialize]);

  // 设置值的函数
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // 允许传入函数来基于前一个值更新
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue]
  );

  // 清除值的函数
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [initialValue, key]);

  // 监听其他标签页的 localStorage 变化
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.warn(
            `Error parsing localStorage change for key "${key}":`,
            error
          );
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize]);

  return [storedValue, setValue, removeValue];
}

// 用于列表页面的持久化状态类型
export interface ListPreferences {
  search?: string;
  filters?: Record<string, unknown>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pageSize?: number;
}

// 专门用于列表页面的持久化 Hook
export function useListPreferences(listKey: string) {
  const [preferences, setPreferences, resetPreferences] =
    useLocalStorage<ListPreferences>(`list-preferences-${listKey}`, {});

  const updatePreferences = useCallback(
    (updates: Partial<ListPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...updates }));
    },
    [setPreferences]
  );

  return {
    preferences,
    updatePreferences,
    resetPreferences,
  };
}
