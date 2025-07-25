'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@repo/ui/components/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Switch } from '@repo/ui/components/switch';
import { Textarea } from '@repo/ui/components/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import { Eye, EyeOff, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { createComment, getComments } from '@/app/actions/comments';
import { createCommentSchema } from '@/lib/schemas/comment';
import type { Comment } from '@/types';

interface CommentSectionProps {
  lectureId: string;
  isSpeaker: boolean;
}

export function CommentSection({ lectureId, isSpeaker }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      lecture_id: lectureId,
      content: '',
      is_anonymous: false,
      visibility: 'public' as 'public' | 'speaker_only',
    },
  });

  // 移除 useAction，直接调用 Server Action
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载评论
  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const response = await getComments({
          lecture_id: lectureId,
          limit: 20,
          offset: 0,
        });

        if (response.success && response.data) {
          setComments(response.data.data);
          setTotalComments(response.data.total);
        }
      } catch (error) {
        console.error('加载评论失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [lectureId]);

  // 建立 SSE 连接，接收实时评论
  useEffect(() => {
    const eventSource = new EventSource(`/api/sse/${lectureId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'new_comment') {
          // 添加新评论到列表
          setComments((prev) => [...prev, data.comment]);
          setTotalComments((prev) => prev + 1);

          // 滚动到底部
          if (scrollAreaRef.current) {
            const scrollViewport = scrollAreaRef.current.querySelector(
              '[data-radix-scroll-area-viewport]'
            );
            if (scrollViewport) {
              setTimeout(() => {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('处理SSE消息失败:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      // 尝试重连（可能是网络中断）
      if (eventSource.readyState === EventSource.CONNECTING) {
        console.log('SSE正在重连...');
      } else if (eventSource.readyState === EventSource.CLOSED) {
        console.error('SSE连接已关闭');
        // 可以在这里实现重连逻辑
      }
    };

    eventSource.onopen = () => {
      console.log('SSE连接已建立');
    };

    return () => {
      eventSource.close();
    };
  }, [lectureId]);

  // 滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, []);

  const onSubmit = async (data: z.infer<typeof createCommentSchema>) => {
    try {
      setIsSubmitting(true);

      // 调用 Server Action 创建评论
      const response = await createComment(data);

      if (response.success && response.data) {
        // 更新评论列表
        setComments((prev) => [...prev, response.data as Comment]);
        setTotalComments((prev) => prev + 1);

        // 清空表单
        form.reset({
          lecture_id: lectureId,
          content: '',
          is_anonymous: false,
          visibility: 'public',
        });
      } else {
        console.error('创建评论失败:', response.error);
      }
    } catch (error) {
      console.error('发送评论失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取用户名首字母
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h3 className="font-semibold text-lg">讨论区</h3>
        <p className="text-muted-foreground text-sm">{totalComments} 条评论</p>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[300px] w-full p-4" ref={scrollAreaRef}>
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p>加载中...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">暂无评论</p>
              <p className="mt-1 text-muted-foreground text-sm">
                发表第一个评论吧！
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  className={`flex gap-3 rounded-lg p-3 ${
                    comment.visibility === 'speaker_only'
                      ? 'border border-info/20 bg-info/10'
                      : 'bg-muted/50'
                  }`}
                  key={comment.id}
                >
                  {/* 用户头像 */}
                  <Avatar className="h-8 w-8">
                    {comment.is_anonymous ? (
                      <AvatarFallback className="bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage
                          alt={comment.user?.name || '用户'}
                          src={comment.user?.avatar_url || undefined}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {comment.user?.is_speaker ? (
                            <span className="font-bold text-xs">讲</span>
                          ) : comment.user?.is_anonymous ? (
                            <span className="text-xs">游</span>
                          ) : (
                            getUserInitials(
                              comment.user?.name || comment.user?.email || 'U'
                            )
                          )}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>

                  {/* 评论内容 */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.is_anonymous
                          ? `匿名${comment.user?.id?.slice(-4) || '用户'}`
                          : comment.user?.is_speaker
                            ? `${comment.user?.name || comment.user?.email} (演讲者)`
                            : comment.user?.is_anonymous
                              ? `匿名${comment.user?.id?.slice(-4) || '游客'}`
                              : comment.user?.name || comment.user?.email}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatTime(comment.created_at)}
                      </span>
                      {comment.visibility === 'speaker_only' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <EyeOff className="h-3 w-3 text-info" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>仅演讲者可见</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-4">
        <Form {...form}>
          <form
            className="w-full space-y-3"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="输入你的评论..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* 匿名开关 - 仅对非演讲者显示 */}
                {!isSpeaker && (
                  <FormField
                    control={form.control}
                    name="is_anonymous"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal text-sm">
                          匿名
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                )}

                {/* 可见性选择 - 仅对非演讲者显示 */}
                {!isSpeaker && (
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <select
                              className="border-0 bg-transparent p-0 text-sm focus:ring-0"
                              onChange={field.onChange}
                              value={field.value}
                            >
                              <option value="public">公开</option>
                              <option value="speaker_only">仅演讲者</option>
                            </select>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Button
                className="gap-2"
                disabled={isSubmitting || !form.formState.isValid}
                type="submit"
              >
                <Send className="h-4 w-4" />
                发送
              </Button>
            </div>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
