'use client';

import type { SessionResponse } from '@repo/auth';
import { signOut } from '@repo/auth/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

interface UserStatusProps {
  session: SessionResponse;
}

/**
 * 用户状态组件
 * 显示用户头像，悬浮展开操作菜单（包括登出）
 */
export default function UserStatus({ session }: UserStatusProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();

  const getNextTheme = () => {
    switch (theme) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'system';
      default:
        return 'light';
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="mr-2 h-4 w-4" />;
      case 'dark':
        return <Moon className="mr-2 h-4 w-4" />;
      default:
        return <Monitor className="mr-2 h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return '明亮模式';
      case 'dark':
        return '深色模式';
      default:
        return '跟随系统';
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // 调用登出 API
      await signOut();
      // 刷新页面，让服务端重定向到首页
      window.location.href = '/';
    } catch (error) {
      console.error('登出失败:', error);
      setIsSigningOut(false);
    }
  };

  // 获取用户名首字母作为头像 fallback
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-10 w-10 rounded-full" variant="ghost">
          <Avatar className="h-10 w-10">
            <AvatarImage
              alt={session.user.name}
              src={session.user.image || undefined}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getUserInitials(session.user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">
              {session.user.name}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.preventDefault(); // 阻止默认行为，防止菜单关闭
            setTheme(getNextTheme());
          }}
          onSelect={(e) => e.preventDefault()} // 阻止选择事件导致菜单关闭
        >
          {getThemeIcon()}
          <span>{getThemeLabel()}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? '正在登出...' : '登出'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
