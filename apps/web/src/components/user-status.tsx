import type { SessionResponse } from '@repo/auth';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import UserMenu from './user-menu';

interface UserStatusProps {
  session: SessionResponse;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 用户状态组件（服务端组件）
 * 显示用户头像，集成 UserMenu 客户端组件处理交互
 */
export default function UserStatus({ session, size = 'md' }: UserStatusProps) {
  // 根据尺寸获取样式
  const sizeStyles = {
    sm: {
      button: 'h-8 w-8',
      avatar: 'h-7 w-7',
    },
    md: {
      button: 'h-10 w-10',
      avatar: 'h-10 w-10',
    },
    lg: {
      button: 'h-12 w-12',
      avatar: 'h-12 w-12',
    },
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
    <UserMenu
      size={size}
      userEmail={session.user.email}
      userName={session.user.name}
    >
      <Button
        className={`relative ${sizeStyles[size].button} rounded-full`}
        variant="ghost"
      >
        <Avatar className={sizeStyles[size].avatar}>
          <AvatarImage
            alt={session.user.name}
            src={session.user.image || undefined}
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getUserInitials(session.user.name)}
          </AvatarFallback>
        </Avatar>
      </Button>
    </UserMenu>
  );
}
