'use client';

import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Copy, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MaterialContentDialogProps {
  materialId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MaterialContent {
  id: string;
  fileName: string;
  fileType: string;
  textContent: string;
}

export function MaterialContentDialog({
  materialId,
  open,
  onOpenChange,
}: MaterialContentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<MaterialContent | null>(null);

  // 获取材料内容
  useEffect(() => {
    if (!(open && materialId)) {
      setContent(null);
      return;
    }

    const fetchContent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/materials/${materialId}/status`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || '获取内容失败');
        }

        const data = await res.json();
        setContent({
          id: data.id,
          fileName: data.fileName,
          fileType: data.fileType,
          textContent: data.textContent || '',
        });
      } catch (error) {
        console.error('Fetch material content error:', error);
        toast.error(error instanceof Error ? error.message : '获取内容失败');
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [materialId, open, onOpenChange]);

  // 复制内容
  const handleCopy = () => {
    if (!content?.textContent) {
      return;
    }

    navigator.clipboard.writeText(content.textContent);
    toast.success('已复制到剪贴板');
  };

  // 下载内容
  const handleDownload = () => {
    if (!content) {
      return;
    }

    const blob = new Blob([content.textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content.fileName}_extracted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('下载成功');
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>材料内容</DialogTitle>
          {content && (
            <DialogDescription>
              {content.fileName} - 提取的文本内容
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : content ? (
          <div className="space-y-4">
            {/* 操作按钮 */}
            <div className="flex justify-end gap-2">
              <Button onClick={handleCopy} size="sm" variant="outline">
                <Copy className="mr-1 h-4 w-4" />
                复制
              </Button>
              <Button onClick={handleDownload} size="sm" variant="outline">
                <Download className="mr-1 h-4 w-4" />
                下载
              </Button>
            </div>

            {/* 内容区域 */}
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {content.textContent}
              </pre>
            </ScrollArea>

            {/* 字数统计 */}
            <p className="text-muted-foreground text-sm">
              共 {content.textContent.length} 个字符
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
