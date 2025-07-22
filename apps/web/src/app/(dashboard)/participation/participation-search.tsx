'use client';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { LogIn, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import JoinLectureDialog from './join-lecture-dialog';

export function ParticipationSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      startTransition(() => {
        router.push(`/participation?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleJoinSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl">参与演讲</h1>
          <p className="text-muted-foreground">查看您参与的演讲和测评</p>
        </div>
        <Button onClick={() => setShowJoinDialog(true)}>
          <LogIn className="mr-2 h-4 w-4" />
          加入演讲
        </Button>
      </div>

      <div className="relative">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          disabled={isPending}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索演讲标题、描述或演讲者..."
          value={searchQuery}
        />
      </div>

      <JoinLectureDialog
        onOpenChange={setShowJoinDialog}
        onSuccess={handleJoinSuccess}
        open={showJoinDialog}
      />
    </>
  );
}
