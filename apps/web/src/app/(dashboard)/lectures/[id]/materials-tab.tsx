'use client';

import {
  MAX_FILE_SIZE,
  MIME_TYPE_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from '@repo/gemini-api';
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
import {
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { deleteMaterial } from '@/app/actions/materials';
import type { Material } from '@/types';

/**
 * 材料准备标签页组件 - 文件管理器风格
 * 支持文件上传、预览和管理
 */
export default function MaterialsTab({ lectureId }: { lectureId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // 初始加载材料列表
  useEffect(() => {
    async function loadMaterials() {
      try {
        const response = await fetch(`/api/materials?lectureId=${lectureId}`);
        const data = await response.json();
        setMaterials(data.materials || []);
      } catch (error) {
        console.error('Failed to load materials:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMaterials();
  }, [lectureId]);

  /**
   * 处理文件上传
   */
  const handleUpload = useCallback(
    async (files: File[]) => {
      setUploading(true);

      try {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('lectureId', lectureId);

          const response = await fetch('/api/materials/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '上传失败');
          }

          toast.success(`${file.name} 上传成功`);
        }

        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '上传失败');
      } finally {
        setUploading(false);
      }
    },
    [lectureId, router]
  );

  /**
   * 删除材料
   */
  const handleDelete = async (materialId: string) => {
    setDeletingIds((prev) => new Set(prev).add(materialId));

    try {
      await deleteMaterial(materialId);
      toast.success('材料已删除');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(materialId);
        return next;
      });
    }
  };

  /**
   * 预览材料内容
   */
  const handlePreview = async (material: Material) => {
    try {
      const response = await fetch(`/api/materials/${material.id}/content`);
      const data = await response.json();

      setPreviewContent(data.content);
      setPreviewFileName(material.file_name);
      setShowPreview(true);
    } catch {
      toast.error('获取内容失败');
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        if (
          !SUPPORTED_MIME_TYPES.includes(
            file.type as 'text/plain' | 'application/pdf'
          )
        ) {
          toast.error(`不支持的文件类型: ${file.name}`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`文件过大: ${file.name} (最大 10MB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        handleUpload(validFiles);
      }
    },
    [handleUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_MIME_TYPES.reduce(
      (acc, mimeType) => {
        acc[mimeType] = MIME_TYPE_EXTENSIONS[mimeType] || [];
        return acc;
      },
      {} as { [key: string]: string[] }
    ),
    maxSize: MAX_FILE_SIZE,
    disabled: uploading,
  });

  /**
   * 获取文件图标
   */
  const getFileIcon = (_material: Material) => {
    return FileText;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-16 w-full" key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        } ${uploading ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-2 font-medium text-lg">
          {isDragActive ? '释放文件以上传' : '拖拽文件到这里，或点击选择文件'}
        </p>
        <p className="text-muted-foreground text-sm">
          支持 PDF、TXT、MD、HTML 等格式，单个文件最大 10MB
        </p>
      </div>

      {/* 材料列表 */}
      {materials.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 font-medium">还没有上传任何材料</p>
          <p className="text-muted-foreground text-sm">
            上传相关文档，AI 将基于这些内容生成测验题目
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => {
            const Icon = getFileIcon(material);
            const isDeleting = deletingIds.has(material.id);

            return (
              <div
                className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-sm"
                key={material.id}
              >
                {/* 文件图标 */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* 文件信息 */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{material.file_name}</p>
                  <div className="flex items-center gap-4 text-muted-foreground text-sm">
                    <span>{material.file_type}</span>
                    <span>
                      {new Date(material.created_at).toLocaleDateString(
                        'zh-CN'
                      )}
                    </span>
                  </div>
                </div>

                {/* 状态指示器 */}
                {material.upload_status === 'completed' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">已处理</span>
                  </div>
                ) : material.upload_status === 'failed' ? (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">处理失败</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">处理中...</span>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {material.text_content && (
                    <Button
                      onClick={() => handlePreview(material)}
                      size="sm"
                      variant="ghost"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    disabled={isDeleting}
                    onClick={() => handleDelete(material.id)}
                    size="sm"
                    variant="ghost"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 预览对话框 */}
      <Dialog onOpenChange={setShowPreview} open={showPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFileName}</DialogTitle>
            <DialogDescription>材料内容预览</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[600px] rounded-lg border bg-muted/20 p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {previewContent}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
