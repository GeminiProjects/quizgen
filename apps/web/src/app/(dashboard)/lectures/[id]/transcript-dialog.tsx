'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Transcript } from '@/types';

interface TranscriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transcripts: Transcript[];
  isActive: boolean;
}

export default function TranscriptDialog({
  open,
  onOpenChange,
  transcripts,
  isActive,
}: TranscriptDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const formatTimestamp = (date: string) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const filteredTranscripts = useMemo(() => {
    if (!searchQuery.trim()) {
      return transcripts;
    }

    const query = searchQuery.toLowerCase();
    return transcripts.filter((transcript) =>
      transcript.text.toLowerCase().includes(query)
    );
  }, [transcripts, searchQuery]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>转录记录</span>
            {isActive && (
              <Badge
                className="bg-success text-success-foreground"
                variant="secondary"
              >
                实时转录中
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>查看和搜索完整的演讲转录内容</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索栏 */}
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pr-10 pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索转录内容..."
              value={searchQuery}
            />
            {searchQuery && (
              <Button
                className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* 转录内容 */}
          <ScrollArea className="h-[400px] w-full rounded-lg border p-4">
            {filteredTranscripts.length > 0 ? (
              <div className="space-y-4">
                {filteredTranscripts.map((transcript) => (
                  <div
                    className="space-y-1 border-b pb-3 last:border-0"
                    key={transcript.id}
                  >
                    <p className="text-muted-foreground text-xs">
                      {formatTimestamp(transcript.created_at)}
                    </p>
                    <p className="text-sm leading-relaxed">{transcript.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? '没有找到匹配的转录内容'
                    : isActive
                      ? '等待转录内容...'
                      : '暂无转录内容'}
                </p>
              </div>
            )}
          </ScrollArea>

          {/* 统计信息 */}
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <span>共 {filteredTranscripts.length} 条转录记录</span>
            {searchQuery && (
              <span>
                搜索结果: {filteredTranscripts.length} / {transcripts.length}
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
