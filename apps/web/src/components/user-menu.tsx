'use client';

import { signOut } from '@repo/auth/client';
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

interface UserMenuProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 用户菜单客户端组件
 * 处理用户菜单的交互逻辑（主题切换和登出）
 */
export default function UserMenu({
  children,
  userName,
  userEmail,
  size = 'md',
}: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();

  // 根据尺寸获取样式
  const sizeStyles = {
    sm: {
      dropdown: 'w-48',
    },
    md: {
      dropdown: 'w-56',
    },
    lg: {
      dropdown: 'w-64',
    },
  };

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

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={sizeStyles[size].dropdown}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">{userName}</p>
            <p className="text-muted-foreground text-xs leading-none">
              {userEmail}
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
