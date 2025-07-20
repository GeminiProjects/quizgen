'use client';

import {
  MAX_FILE_SIZE,
  MIME_TYPE_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from '@repo/ai';
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
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // 检查删除的材料（上传失败）
  const checkDeletedMaterials = useCallback(
    (oldMaterials: Material[], newMaterials: Material[]) => {
      if (oldMaterials.length === 0) {
        return;
      }

      const newIds = new Set(newMaterials.map((m) => m.id));
      const deletedMaterials = oldMaterials.filter(
        (m) => !newIds.has(m.id) && m.upload_status !== 'completed'
      );

      for (const m of deletedMaterials) {
        toast.error(`${m.file_name} 上传失败`);
      }
    },
    []
  );

  // 刷新材料列表
  const refreshMaterials = useCallback(
    async (showError = true) => {
      setRefreshing(true);
      try {
        const response = await fetch(`/api/materials?lectureId=${lectureId}`);
        const data = await response.json();
        const newMaterials = data.materials || [];

        // 检测删除的材料
        checkDeletedMaterials(materials, newMaterials);
        setMaterials(newMaterials);
      } catch (error) {
        console.error('Failed to load materials:', error);
        if (showError) {
          toast.error('加载材料列表失败');
        }
      } finally {
        setRefreshing(false);
      }
    },
    [lectureId, materials, checkDeletedMaterials]
  );

  // 初始加载材料列表
  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/materials?lectureId=${lectureId}`);
        const data = await response.json();
        setMaterials(data.materials || []);
      } catch (error) {
        console.error('Failed to load materials:', error);
        toast.error('加载材料列表失败');
      } finally {
        setLoading(false);
      }
    };
    loadMaterials();
  }, [lectureId]);

  // 轮询检查处理中的材料
  useEffect(() => {
    // 检查是否有处理中的材料
    const hasProcessingMaterials = materials.some(
      (m) =>
        m.upload_status === 'uploading' ||
        m.upload_status === 'processing' ||
        m.upload_status === 'extracting'
    );

    if (hasProcessingMaterials && !pollingInterval) {
      // 开始轮询
      const interval = setInterval(() => {
        refreshMaterials(false);
      }, 3000); // 每3秒检查一次
      setPollingInterval(interval);
    } else if (!hasProcessingMaterials && pollingInterval) {
      // 停止轮询
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    // 清理函数
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [materials, pollingInterval, refreshMaterials]);

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

          const result = await response.json();
          toast.success(`${file.name} 上传成功`);

          // 立即添加到列表（处理中状态）
          const newMaterial: Material = {
            id: result.materialId,
            file_name: file.name,
            file_type: file.type,
            upload_status: 'uploading',
            processing_progress: 0,
            text_content: null,
            error_message: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            lecture_id: lectureId,
            created_by: '',
            gemini_file_uri: null,
          };
          setMaterials((prev) => [newMaterial, ...prev]);
        }

        // 延迟刷新以确保文件处理开始
        setTimeout(() => {
          refreshMaterials(false);

          // 持续检查上传状态
          let checkCount = 0;
          const checkInterval = setInterval(() => {
            checkCount++;
            refreshMaterials(false);

            // 最多检查20次（60秒）
            if (checkCount >= 20) {
              clearInterval(checkInterval);
            }
          }, 3000);
        }, 2000);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '上传失败');
        // 上传失败后刷新列表
        await refreshMaterials(false);
      } finally {
        setUploading(false);
      }
    },
    [lectureId, refreshMaterials]
  );

  /**
   * 删除材料
   */
  const handleDelete = async (materialId: string) => {
    setDeletingIds((prev) => new Set(prev).add(materialId));

    try {
      const result = await deleteMaterial(materialId);
      if (result.success) {
        toast.success('材料已删除');
        // 刷新材料列表
        await refreshMaterials();
      } else {
        toast.error(result.error || '删除失败');
      }
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
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">演讲材料</h3>
        <Button
          disabled={refreshing}
          onClick={() => refreshMaterials()}
          size="sm"
          variant="outline"
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          刷新
        </Button>
      </div>

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
      {materials.length > 0 && (
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>共 {materials.length} 个文件</span>
          {materials.some(
            (m) =>
              m.upload_status === 'uploading' ||
              m.upload_status === 'processing' ||
              m.upload_status === 'extracting'
          ) && (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              正在处理中...
            </span>
          )}
        </div>
      )}

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
