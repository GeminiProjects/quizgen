'use client';

import { Input } from '@repo/ui/components/input';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ListSearchProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function ListSearch({
  value = '',
  onChange,
  placeholder = '搜索...',
  debounceMs = 300,
  className,
}: ListSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  // 同步外部 value 变化
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 防抖处理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={className}>
      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pr-9 pl-9"
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          type="text"
          value={localValue}
        />
        {localValue && (
          <button
            className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
