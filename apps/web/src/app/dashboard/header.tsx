import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { LogOut } from 'lucide-react';
import type React from 'react';

type HeaderProps = {
  displayName: string;
  email: string;
  avatarUrl: string;
  onSignOut: () => void;
};

const Header: React.FC<HeaderProps> = ({
  displayName,
  email,
  avatarUrl,
  onSignOut,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-foreground">
            QuizGen Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">智能演讲互动平台</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage alt={displayName} src={avatarUrl} />
              <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{displayName}</div>
              <div className="text-muted-foreground text-sm">{email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onSignOut}
              size="icon"
              title="登出"
              variant="outline"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
