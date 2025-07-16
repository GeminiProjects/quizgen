'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { MessageCircle, Sparkles, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { LoginModal } from '@/components/auth/login-modal';
import { UserSession } from '@/components/auth/user-session';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="border-b bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-bold text-gray-900 text-xl">QuizGen</span>
            </div>
            <div className="flex items-center space-x-4">
              <UserSession />
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setShowLogin(true)}
              >
                登录
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main>
        {/* 英雄区域 */}
        <section className="container mx-auto max-w-7xl px-4 py-20">
          <div className="text-center">
            <h1 className="mb-6 font-bold text-4xl text-gray-900 sm:text-5xl lg:text-6xl">
              校园演讲即时测评系统
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-gray-600 text-lg">
              通过AI生成的互动问答，让您的演讲更加生动有趣
            </p>
            <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                onClick={() => setShowLogin(true)}
                size="lg"
              >
                开始使用
              </Button>
              <Button
                asChild
                className="w-full sm:w-auto"
                size="lg"
                variant="outline"
              >
                <Link href="#features">了解更多</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 功能特性 - 简化版 */}
        <section className="py-20" id="features">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-bold text-3xl text-gray-900">
                核心功能
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* 实时问答 */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <MessageCircle className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">实时问答</h3>
                  <p className="text-gray-600 text-sm">
                    AI生成的智能问答，让听众即时参与互动
                  </p>
                </CardContent>
              </Card>

              {/* 多人协作 */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">多人协作</h3>
                  <p className="text-gray-600 text-sm">
                    支持组织管理，多个演讲者共同管理讲座
                  </p>
                </CardContent>
              </Card>

              {/* 即时反馈 */}
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">即时反馈</h3>
                  <p className="text-gray-600 text-sm">
                    听众答题后立即显示结果，实时调整演讲节奏
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* 简洁页脚 */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <div className="mb-4 flex items-center justify-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">QuizGen</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 QuizGen. 让演讲更具互动性的智能平台
          </p>
        </div>
      </footer>

      {/* 登录弹窗 */}
      <LoginModal onOpenChange={setShowLogin} open={showLogin} />
    </div>
  );
}
