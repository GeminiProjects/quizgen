/**
 * GitHub 登录组件
 * 提供简单的 GitHub OAuth 登录按钮
 */
'use client';

import { Button } from '@repo/ui/components/button';
import { useState } from 'react';
import { signIn } from '@/lib/auth-client';

interface GitHubLoginProps {
  // 登录成功后的回调 URL
  callbackURL?: string;
  // 按钮文本
  children?: React.ReactNode;
  // 样式类名
  className?: string;
}

export function GitHubLogin({
  callbackURL = '/dashboard',
  children = '使用 GitHub 登录',
  className,
}: GitHubLoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn.social({
        provider: 'github',
        callbackURL,
      });
    } catch (error) {
      console.error('GitHub 登录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={className}
      disabled={isLoading}
      onClick={handleLogin}
      variant="outline"
    >
      {isLoading ? '登录中...' : children}
    </Button>
  );
}
