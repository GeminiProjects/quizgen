'use client';

import { ArrowRight, Github } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { GitHubLogin } from '@/components/auth/github-login';
import { useSession } from '@/lib/auth-client';

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 确保客户端渲染完成
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取当前主题
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const logoSrc = currentTheme === 'dark' ? '/logo-dark-mode.png' : '/logo.png';

  // 已登录用户自动跳转到 dashboard
  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* 主要内容区域 */}
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center">
            {mounted && (
              <Image
                alt="QuizGen Logo"
                className="h-24 w-24"
                height={96}
                src={logoSrc}
                width={96}
              />
            )}
          </div>

          {/* 产品名 */}
          <h1 className="mb-4 font-bold text-5xl text-foreground tracking-tight">
            QuizGen
          </h1>

          {/* 产品描述 */}
          <p className="mb-12 text-muted-foreground text-xl leading-relaxed">
            校园演讲即时测评系统
          </p>

          {/* GitHub 登录按钮 */}
          <div className="space-y-4">
            <GitHubLogin className="w-full">
              <Github className="mr-2 h-5 w-5" />
              使用 GitHub 登录
            </GitHubLogin>

            {/* <p className="text-gray-500 text-sm dark:text-gray-500">
              这是一个开源项目。
            </p> */}
          </div>

          {/* 功能特点 */}
          <div className="mt-16 grid grid-cols-1 gap-6 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">实时生成测评</h3>
                <p className="text-muted-foreground text-sm">
                  基于演讲内容智能生成互动题目
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">即时互动反馈</h3>
                <p className="text-muted-foreground text-sm">
                  观众实时参与，获得即时反馈
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">数据分析洞察</h3>
                <p className="text-muted-foreground text-sm">
                  全面的参与度和理解度分析报告
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
