'use client';

import { authClient } from '@repo/auth/client';
import { Button } from '@repo/ui/components/button';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

export default function AnnoymousLogin() {
  const router = useRouter();
  const handleLogin = async () => {
    const result = await authClient.signIn.anonymous();
    if (result.data?.user) {
      router.push('/participation');
    } else {
      toast.error('匿名登录失败');
    }
  };

  return (
    <Button className="w-full" onClick={handleLogin} variant="outline">
      <LogIn className="mr-2 h-4 w-4" />
      匿名登录
    </Button>
  );
}
