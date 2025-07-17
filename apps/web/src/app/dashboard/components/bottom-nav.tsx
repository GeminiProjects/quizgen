'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { cn } from '@repo/ui/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Monitor, Moon, Presentation, Sun, Users, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userInfo: {
    avatar?: string;
    name?: string;
  };
}

export function BottomNav({
  currentTab,
  onTabChange,
  userInfo,
}: BottomNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, setTheme } = useTheme();

  // 辅助函数，用于获取标签按钮的样式类
  const getTabButtonClass = (isActive: boolean, colorClass: string) => {
    if (!isActive) {
      return 'hover:bg-muted/80';
    }

    switch (colorClass) {
      case 'success':
        return 'bg-success/20 hover:bg-success/25 dark:bg-success/15';
      case 'info':
        return 'bg-info/20 hover:bg-info/25 dark:bg-info/15';
      case 'warning':
        return 'bg-warning/20 hover:bg-warning/25 dark:bg-warning/15';
      default:
        return 'hover:bg-muted/80';
    }
  };

  // 辅助函数，用于获取标签图标的样式类
  const getTabIconClass = (isActive: boolean, colorClass: string) => {
    if (!isActive) {
      return 'bg-muted/50 text-muted-foreground';
    }

    switch (colorClass) {
      case 'success':
        return 'bg-success/20 text-success dark:bg-success/25';
      case 'info':
        return 'bg-info/20 text-info dark:bg-info/25';
      case 'warning':
        return 'bg-warning/20 text-warning dark:bg-warning/25';
      default:
        return 'bg-muted/50 text-muted-foreground';
    }
  };

  // 辅助函数，用于获取标签文本的样式类
  const getTabTextClass = (colorClass: string) => {
    switch (colorClass) {
      case 'success':
        return 'text-success';
      case 'info':
        return 'text-info';
      case 'warning':
        return 'text-warning';
      default:
        return '';
    }
  };

  const tabs = [
    {
      id: 'participation',
      label: '参与记录',
      icon: Mic,
      description: '查看参与的演讲和测评',
      colorClass: 'success',
    },
    {
      id: 'lectures',
      label: '我的演讲',
      icon: Presentation,
      description: '管理创建的演讲会话',
      colorClass: 'info',
    },
    {
      id: 'organizations',
      label: '我的组织',
      icon: Users,
      description: '创建和管理演讲组织',
      colorClass: 'warning',
    },
  ];

  return (
    <>
      {/* 背景遮罩 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="关闭导航"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            transition={{ duration: 0.2 }}
            type="button"
          />
        )}
      </AnimatePresence>

      {/* 底部导航栏 - 固定在右下角，增加宽度避免换行 */}
      <div className="fixed right-4 bottom-4 z-50 w-[calc(100vw/2.2)] min-w-[200px] max-w-[280px] md:hidden">
        <motion.div
          aria-label="底部导航"
          className={cn(
            'relative rounded-2xl',
            // 增加对比度: light 模式下更深，dark 模式下更浅
            'bg-zinc-100/95 backdrop-blur-xl dark:bg-zinc-900/95',
            'shadow-black/20 shadow-xl dark:shadow-black/40',
            'border border-zinc-200 dark:border-zinc-800',
            'overflow-hidden'
          )}
          layout
        >
          {/* 展开的标签页选项 - 使用 framer-motion 实现平滑动画 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden"
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="px-2 pt-2 pb-1">
                  {tabs.map((tab) => (
                    <button
                      className={cn(
                        'w-full rounded-xl p-4 text-left transition-all',
                        currentTab === tab.id
                          ? getTabButtonClass(true, tab.colorClass)
                          : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                      )}
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setIsExpanded(false);
                      }}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            getTabIconClass(
                              currentTab === tab.id,
                              tab.colorClass
                            )
                          )}
                        >
                          <tab.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              'font-medium text-sm',
                              currentTab === tab.id &&
                                getTabTextClass(tab.colorClass)
                            )}
                          >
                            {tab.label}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {/* 主题切换 */}
                  <div className="mt-2 border-border/50 border-t pt-2">
                    <button
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextTheme =
                          theme === 'light'
                            ? 'dark'
                            : theme === 'dark'
                              ? 'system'
                              : 'light';
                        setTheme(nextTheme);
                      }}
                      type="button"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                        {theme === 'light' ? (
                          <Sun className="h-4 w-4 text-muted-foreground" />
                        ) : theme === 'dark' ? (
                          <Moon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground text-sm">
                          {theme === 'light'
                            ? '明亮模式'
                            : theme === 'dark'
                              ? '深色模式'
                              : '跟随系统'}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          点击切换主题
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 头像按钮区域 - 保持固定高度 */}
          <motion.div className="h-14" layout="position">
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="flex h-full items-center justify-between px-3"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  key="expanded"
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={userInfo.avatar} />
                      <AvatarFallback>
                        {userInfo.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-xs">
                        {userInfo.name || '用户'}
                      </div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {tabs.find((t) => t.id === currentTab)?.label}
                      </div>
                    </div>
                  </div>
                  <button
                    aria-label="收起菜单"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(false);
                    }}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  animate={{ opacity: 1 }}
                  aria-label="展开导航菜单"
                  className="flex h-full w-full items-center justify-between gap-2 px-2 transition-colors hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  key="collapsed"
                  onClick={() => setIsExpanded(true)}
                  transition={{ duration: 0.2 }}
                  type="button"
                >
                  <Avatar className="ml-1 h-9 w-9 shrink-0">
                    <AvatarImage src={userInfo.avatar} />
                    <AvatarFallback>
                      {userInfo.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mr-1 flex flex-1 flex-col items-center justify-center">
                    <div className="font-medium text-sm text-zinc-800 dark:text-zinc-200">
                      {userInfo.name || '用户'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {(() => {
                        const currentTabData = tabs.find(
                          (t) => t.id === currentTab
                        );
                        if (!currentTabData) {
                          return null;
                        }
                        const Icon = currentTabData.icon;
                        return (
                          <>
                            <Icon className="h-3 w-3" />
                            <span>{currentTabData.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
