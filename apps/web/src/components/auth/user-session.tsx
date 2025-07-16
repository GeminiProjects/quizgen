/**
 * 用户会话组件
 * 显示用户信息和登出按钮
 */
'use client';

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
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { signOut, useSession } from '@/lib/auth-client';

export function UserSession() {
  const { data: session, isPending } = useSession();

  // 处理登出
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 加载中状态
  if (isPending) {
    return <div className="animate-pulse">加载中...</div>;
  }

  // 未登录状态
  if (!session) {
    return null;
  }

  // 获取用户名首字母作为头像回退
  const getInitials = (name?: string) => {
    if (!name) {
      return 'U';
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-8 w-8 rounded-full" variant="ghost">
          <Avatar className="h-8 w-8">
            <AvatarImage
              alt={session.user.name || ''}
              src={session.user.image || undefined}
            />
            <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {session.user.name && (
              <p className="font-medium">{session.user.name}</p>
            )}
            {session.user.email && (
              <p className="text-muted-foreground text-xs">
                {session.user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuItem onClick={handleSignOut}>退出登录</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
