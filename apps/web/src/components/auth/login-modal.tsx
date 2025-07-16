/**
 * 登录弹窗组件
 * 纯净的 GitHub 登录弹窗
 */
'use client';

import { Dialog, DialogContent } from '@repo/ui/components/dialog';
import { Sparkles } from 'lucide-react';
import { GitHubLogin } from './github-login';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-0 shadow-2xl sm:max-w-sm">
        <div className="space-y-8 py-6">
          {/* 纯净 Logo */}
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>

          {/* 标题 */}
          <div className="text-center">
            <h2 className="font-bold text-2xl text-foreground">QuizGen</h2>
            <p className="mt-2 text-muted-foreground">讲座即时智能评测系统</p>
          </div>

          {/* 登录按钮 */}
          <GitHubLogin
            callbackURL="/dashboard"
            className="h-12 w-full bg-foreground text-background hover:bg-foreground/90 focus:ring-4 focus:ring-ring"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg
                aria-label="GitHub"
                className="h-5 w-5"
                fill="currentColor"
                role="img"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>使用 GitHub 登录</span>
            </div>
          </GitHubLogin>
        </div>
      </DialogContent>
    </Dialog>
  );
}
