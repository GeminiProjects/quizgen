'use client';

import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from 'lucide-react';

export interface SortOption {
  field: string;
  label: string;
}

export interface SortValue {
  field: string;
  direction: 'asc' | 'desc';
}

interface ListSortProps {
  options: SortOption[];
  value?: SortValue;
  onChange: (value: SortValue) => void;
  className?: string;
}

export function ListSort({
  options,
  value,
  onChange,
  className,
}: ListSortProps) {
  const currentOption =
    options.find((opt) => opt.field === value?.field) || options[0];
  const currentDirection = value?.direction || 'desc';

  const handleSelectOption = (field: string) => {
    if (value?.field === field) {
      // 切换排序方向
      onChange({
        field,
        direction: currentDirection === 'asc' ? 'desc' : 'asc',
      });
    } else {
      // 切换排序字段，默认降序
      onChange({
        field,
        direction: 'desc',
      });
    }
  };

  const getSortIcon = () => {
    if (!value) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return currentDirection === 'asc' ? (
      <ArrowUpAZ className="h-4 w-4" />
    ) : (
      <ArrowDownAZ className="h-4 w-4" />
    );
  };

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2" size="sm" variant="outline">
            {getSortIcon()}
            <span>{currentOption?.label || '排序'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((option) => {
            const isActive = value?.field === option.field;
            return (
              <DropdownMenuItem
                className="gap-2"
                key={option.field}
                onClick={() => handleSelectOption(option.field)}
              >
                <span className="flex-1">{option.label}</span>
                {isActive && (
                  <span className="text-muted-foreground">
                    {currentDirection === 'asc' ? '升序' : '降序'}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
