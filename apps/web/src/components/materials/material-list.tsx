'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@repo/ui/lib/utils';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileAudio,
  FileText,
  FileVideo,
  Loader2,
  Presentation,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteMaterial } from '@/app/actions/materials';
import type { Material } from '@/types';

interface MaterialListProps {
  materials: Material[];
  onMaterialsChange?: () => void;
  onViewContent?: (materialId: string) => void;
  className?: string;
}

// 获取文件图标
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('audio/')) {
    return <FileAudio className="h-5 w-5" />;
  }
  if (fileType.startsWith('video/')) {
    return <FileVideo className="h-5 w-5" />;
  }
  if (fileType.includes('presentation')) {
    return <Presentation className="h-5 w-5" />;
  }
  return <FileText className="h-5 w-5" />;
};

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'uploading':
    case 'processing':
    case 'extracting':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

// 获取状态文字
const getStatusText = (status: string) => {
  switch (status) {
    case 'uploading':
      return '上传中';
    case 'processing':
      return '处理中';
    case 'extracting':
      return '提取中';
    case 'completed':
      return '已完成';
    case 'failed':
      return '失败';
    default:
      return '未知';
  }
};

// 获取状态颜色
const getStatusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'uploading':
    case 'processing':
    case 'extracting':
      return 'secondary';
    default:
      return 'outline';
  }
};

export function MaterialList({
  materials,
  onMaterialsChange,
  onViewContent,
  className,
}: MaterialListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 删除材料
  const handleDelete = async () => {
    if (!deletingId || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteMaterial(deletingId);

      if (result.success) {
        toast.success('材料已删除');
        onMaterialsChange?.();
      } else {
        throw new Error(result.error || '删除失败');
      }
    } catch (err) {
      console.error('Delete material error:', err);
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
      setShowDeleteDialog(false);
    }
  };

  // 加载状态
  if (!materials) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>演讲材料</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton className="h-16 w-full" key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>演讲材料 ({materials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">还没有上传任何材料</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {materials.map((material) => (
                  <Card
                    className={cn(
                      'transition-colors',
                      material.upload_status === 'failed' &&
                        'border-destructive/50'
                    )}
                    key={material.id}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      {/* 文件图标 */}
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          material.upload_status === 'completed'
                            ? 'bg-primary/10 text-primary'
                            : material.upload_status === 'failed'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-secondary/10 text-secondary-foreground'
                        )}
                      >
                        {getFileIcon(material.file_type)}
                      </div>

                      {/* 文件信息 */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {material.file_name}
                          </p>
                          <Badge
                            variant={getStatusVariant(
                              material.upload_status || 'pending'
                            )}
                          >
                            <span className="mr-1">
                              {getStatusIcon(
                                material.upload_status || 'pending'
                              )}
                            </span>
                            {getStatusText(material.upload_status || 'pending')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground text-xs">
                          <span>
                            {new Date(material.created_at).toLocaleString(
                              'zh-CN'
                            )}
                          </span>
                          {material.error_message && (
                            <span className="text-destructive">
                              {material.error_message}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        {material.upload_status === 'completed' &&
                          material.text_content && (
                            <Button
                              onClick={() => onViewContent?.(material.id)}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              查看
                            </Button>
                          )}
                        <Button
                          className="h-8 w-8"
                          onClick={() => {
                            setDeletingId(material.id);
                            setShowDeleteDialog(true);
                          }}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个材料吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
