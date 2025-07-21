'use client';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useClipboard } from '@/hooks/use-clipboard';

interface SecretFieldProps {
  value: string;
  label?: string;
  copySuccessMessage?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 通用密钥/密码显示组件
 * 提供显示/隐藏和复制功能
 */
export function SecretField({
  value,
  label,
  copySuccessMessage = '已复制到剪贴板',
  className,
  disabled = false,
}: SecretFieldProps) {
  const [showSecret, setShowSecret] = useState(false);
  const { copyToClipboard } = useClipboard();

  const inputId = `secret-field-${Math.random().toString(36).substring(7)}`;

  return (
    <div className={className}>
      {label && (
        <label
          className="font-medium text-muted-foreground text-sm"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <Input
          className="font-mono"
          disabled={disabled}
          id={inputId}
          readOnly
          type={showSecret ? 'text' : 'password'}
          value={value}
        />
        <Button
          disabled={disabled}
          onClick={() => setShowSecret(!showSecret)}
          size="icon"
          type="button"
          variant="outline"
        >
          {showSecret ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
        <Button
          disabled={disabled}
          onClick={() => copyToClipboard(value, copySuccessMessage)}
          size="icon"
          type="button"
          variant="outline"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
