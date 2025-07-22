'use client';

import { Button } from '@repo/ui/components/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import type { LectureStatus } from '@/types';

type FilterOption = {
  label: string;
  value: LectureStatus | 'all';
};

const filterOptions: FilterOption[] = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'in_progress' },
  { label: '未开始', value: 'not_started' },
  { label: '已结束', value: 'ended' },
];

export function LectureFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      // 当筛选条件改变时，重置到第一页
      params.set('page', '1');
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="flex items-center space-x-2">
      <p className="font-medium text-muted-foreground text-sm">状态筛选:</p>
      {filterOptions.map((option) => (
        <Button
          key={option.value}
          onClick={() => {
            router.push(`?${createQueryString('status', option.value)}`);
          }}
          size="sm"
          variant={currentStatus === option.value ? 'default' : 'outline'}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
