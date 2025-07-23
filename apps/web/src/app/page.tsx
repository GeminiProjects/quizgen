import { ChartBar, MessageSquare, Sparkles } from 'lucide-react';
import Image from 'next/image';
import AnnoymousLogin from '@/components/auth/annoymous-login';
import { GitHubLogin } from '@/components/auth/github-login';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 主要内容区域 */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center">
          {/* Logo - 使用 CSS 处理主题切换 */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center sm:mb-8 sm:h-24 sm:w-24">
            {/* Light mode logo */}
            <Image
              alt="QuizGen Logo"
              className="h-20 w-20 sm:h-24 sm:w-24 dark:hidden"
              height={96}
              priority
              src="/logo.png"
              width={96}
            />
            {/* Dark mode logo */}
            <Image
              alt="QuizGen Logo"
              className="hidden h-20 w-20 sm:h-24 sm:w-24 dark:block"
              height={96}
              priority
              src="/logo-dark-mode.png"
              width={96}
            />
          </div>

          {/* 产品名 */}
          <h1 className="mb-3 font-bold text-4xl text-foreground tracking-tight sm:mb-4 sm:text-5xl">
            QuizGen
          </h1>

          {/* 产品描述 */}
          <p className="mb-8 text-lg text-muted-foreground leading-relaxed sm:mb-12 sm:text-xl">
            演讲即时智能评测系统
          </p>

          {/* 登录按钮 */}
          <div className="space-y-4">
            {process.env.GITHUB_CLIENT_ID &&
              process.env.GITHUB_CLIENT_SECRET && (
                <GitHubLogin className="w-full" />
              )}
            {process.env.NODE_ENV === 'development' && <AnnoymousLogin />}
          </div>

          {/* 功能特点 */}
          <div className="mt-10 grid grid-cols-1 gap-4 text-left sm:mt-16 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  实时生成测评
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  基于演讲内容智能生成互动题目
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500 sm:h-10 sm:w-10">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  即时互动反馈
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  观众实时参与，获得即时反馈
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 sm:h-10 sm:w-10">
                <ChartBar className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  数据分析洞察
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  全面的参与度和理解度分析报告
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="w-full px-4 py-3 text-center sm:py-4">
        <p className="text-muted-foreground text-xs sm:text-sm">
          Made by{' '}
          <a
            className="text-foreground underline-offset-4 hover:underline"
            href="https://github.com/GeminiProjects/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Team Gemini
          </a>{' '}
          from NJUST
        </p>
      </footer>
    </div>
  );
}
