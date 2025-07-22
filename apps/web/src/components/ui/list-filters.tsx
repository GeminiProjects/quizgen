'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { ListFilter, X } from 'lucide-react';
import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

interface ListFiltersProps {
  groups: FilterGroup[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  className?: string;
}

export function ListFilters({
  groups,
  values,
  onChange,
  className,
}: ListFiltersProps) {
  const activeFiltersCount = Object.keys(values).reduce((count, key) => {
    const value = values[key];
    if (Array.isArray(value)) {
      return count + value.length;
    }
    return value ? count + 1 : count;
  }, 0);

  const handleFilterChange = (
    groupId: string,
    optionValue: string,
    checked: boolean
  ) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      return;
    }

    const currentValue = values[groupId];

    if (group.multiple) {
      // 多选
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      const newValue = checked
        ? [...currentArray, optionValue]
        : currentArray.filter((v) => v !== optionValue);

      const newValues = { ...values };
      if (newValue.length > 0) {
        newValues[groupId] = newValue;
      } else {
        delete newValues[groupId];
      }
      onChange(newValues);
    } else {
      // 单选
      const newValues = { ...values };
      if (checked) {
        newValues[groupId] = optionValue;
      } else {
        delete newValues[groupId];
      }
      onChange(newValues);
    }
  };

  const clearAllFilters = () => {
    onChange({});
  };

  const getActiveFilters = () => {
    const active: Array<{
      groupId: string;
      groupLabel: string;
      optionLabel: string;
      optionValue: string;
    }> = [];

    groups.forEach((group) => {
      const value = values[group.id];
      if (!value) {
        return;
      }
      const valueArray = Array.isArray(value) ? value : [value];
      valueArray.forEach((v) => {
        const option = group.options.find((opt) => opt.value === v);
        if (option) {
          active.push({
            groupId: group.id,
            groupLabel: group.label,
            optionLabel: option.label,
            optionValue: option.value,
          });
        }
      });
    });

    return active;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2" size="sm" variant="outline">
              <ListFilter className="h-4 w-4" />
              筛选
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 px-1 text-xs" variant="secondary">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {groups.map((group, index) => (
              <React.Fragment key={group.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.options.map((option) => {
                  const groupValue = values[group.id];
                  const isChecked = Array.isArray(groupValue)
                    ? (groupValue as string[]).includes(option.value)
                    : groupValue === option.value;

                  return (
                    <DropdownMenuCheckboxItem
                      checked={isChecked}
                      key={option.value}
                      onCheckedChange={(checked) =>
                        handleFilterChange(group.id, option.value, checked)
                      }
                    >
                      {option.icon && (
                        <span className="mr-2">{option.icon}</span>
                      )}
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </React.Fragment>
            ))}
            {activeFiltersCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <Button
                  className="w-full justify-start text-muted-foreground"
                  onClick={clearAllFilters}
                  size="sm"
                  variant="ghost"
                >
                  清除所有筛选
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activeFilters.map((filter) => (
              <Badge
                className="gap-1 pr-1"
                key={`${filter.groupId}-${filter.optionValue}`}
                variant="secondary"
              >
                <span className="text-xs">{filter.optionLabel}</span>
                <button
                  className="ml-1 rounded-full hover:bg-muted"
                  onClick={() =>
                    handleFilterChange(
                      filter.groupId,
                      filter.optionValue,
                      false
                    )
                  }
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
