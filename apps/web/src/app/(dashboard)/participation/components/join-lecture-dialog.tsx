'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { joinLectureByCode } from '@/app/actions/participation';

// 表单验证模式
const joinLectureSchema = z.object({
  code: z
    .string()
    .min(1, '请输入演讲码')
    .length(6, '演讲码为6位字符')
    .toUpperCase(),
  nickname: z.string().optional(),
});

type JoinLectureFormData = z.infer<typeof joinLectureSchema>;

export function JoinLectureDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<JoinLectureFormData>({
    resolver: zodResolver(joinLectureSchema),
    defaultValues: {
      code: '',
      nickname: '',
    },
  });

  async function onSubmit(values: JoinLectureFormData) {
    setIsLoading(true);

    try {
      const result = await joinLectureByCode(values.code, values.nickname);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success('成功加入演讲！');
      form.reset();
      setOpen(false);

      // 跳转到参与详情页
      router.push(`/participation/${result.data.lecture.id}`);
    } catch (error) {
      toast.error('加入演讲失败，请重试');
      console.error('加入演讲失败:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          加入演讲
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>加入演讲</DialogTitle>
          <DialogDescription>输入演讲码即可参与演讲互动</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>演讲码</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="uppercase"
                      disabled={isLoading}
                      maxLength={6}
                      placeholder="请输入6位演讲码"
                    />
                  </FormControl>
                  <FormDescription>
                    演讲码由演讲者提供，通常显示在演讲现场
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                disabled={isLoading}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                取消
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                加入
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
