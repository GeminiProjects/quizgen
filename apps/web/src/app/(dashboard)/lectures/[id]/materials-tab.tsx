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
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import useSWR from 'swr';
import {
  deleteMaterial,
  getMaterialContent,
  getMaterialsKey,
  type Material,
  type MaterialsData,
  pollMaterialStatus,
  refreshMaterials,
  uploadFile,
} from '@/hooks/use-materials';

interface MaterialsTabProps {
  lectureId: string;
}

/**
 * 材料准备标签页组件 - 文件管理器风格
 * 支持文件上传、预览和管理
 */
export default function MaterialsTab({ lectureId }: MaterialsTabProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{
    fileName: string;
    content: string;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [processingMaterials, setProcessingMaterials] = useState<Set<string>>(
    new Set()
  );

  // 使用 SWR 获取材料列表
  const { data, error, isLoading } = useSWR<MaterialsData>(
    getMaterialsKey(lectureId),
    (url: string) => fetch(url).then((res) => res.json()),
    {
      refreshInterval: 5000, // 每5秒刷新一次
    }
  );

  const materials = data?.materials || [];

  /**
   * 处理文件上传
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // 过滤支持的文件类型
      const supportedFiles = acceptedFiles.filter((file) => {
        return (SUPPORTED_MIME_TYPES as readonly string[]).includes(file.type);
      });

      // 检查文件大小
      const validFiles = supportedFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(
            `文件 ${file.name} 超过 ${MAX_FILE_SIZE / 1024 / 1024}MB 限制`
          );
          return false;
        }
        return true;
      });

      if (supportedFiles.length < acceptedFiles.length) {
        toast.warning('部分文件类型不支持，已自动过滤');
      }

      if (validFiles.length === 0) {
        return;
      }

      // 直接上传文件
      setUploading(true);
      const uploadPromises = validFiles.map(async (file) => {
        try {
          // 上传文件
          const { materialId } = await uploadFile(file, lectureId);

          // 添加到处理中列表
          setProcessingMaterials((prev) => new Set(prev).add(materialId));

          // 刷新材料列表
          await refreshMaterials(lectureId);

          // 轮询处理状态
          const result = await pollMaterialStatus(materialId, {
            onProgress: (status, progress) => {
              console.log(`文件 ${file.name}: ${status} - ${progress}%`);
              // 更新进度提示
              if (status === 'processing') {
                toast.loading(`正在处理 ${file.name}... ${progress}%`, {
                  id: `processing-${materialId}`,
                });
              } else if (status === 'extracting') {
                toast.loading(`正在提取文本内容 ${file.name}... ${progress}%`, {
                  id: `processing-${materialId}`,
                });
              }
            },
          });

          // 移除处理中状态
          setProcessingMaterials((prev) => {
            const newSet = new Set(prev);
            newSet.delete(materialId);
            return newSet;
          });

          // 刷新材料列表
          await refreshMaterials(lectureId);

          // 关闭处理提示
          toast.dismiss(`processing-${materialId}`);

          if (result.status === 'completed') {
            toast.success(`${file.name} 处理完成，文件已准备就绪！`);
          } else {
            toast.error(`${file.name} 处理失败: ${result.error}`);
          }

          return { success: result.status === 'completed', file };
        } catch (err) {
          console.error(`上传失败 ${file.name}:`, err);
          toast.error(`${file.name} 上传失败`);
          return { success: false, file };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter((r) => r.success).length;

      if (successCount === validFiles.length) {
        toast.success('所有文件上传成功');
      } else if (successCount > 0) {
        toast.warning(`${successCount}/${validFiles.length} 个文件上传成功`);
      }

      setUploading(false);
    },
    [lectureId]
  );

  /**
   * 删除已上传的材料
   */
  const handleDelete = async (e: React.MouseEvent, materialId: string) => {
    e.stopPropagation();
    try {
      await deleteMaterial(materialId);
      await refreshMaterials(lectureId);
      toast.success('材料已删除');
      if (selectedMaterial?.id === materialId) {
        setSelectedMaterial(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  /**
   * 预览材料内容
   */
  const handlePreview = async (e: React.MouseEvent, material: Material) => {
    e.stopPropagation();
    if (material.status !== 'completed' || !material.hasContent) {
      toast.error('该文件还未处理完成或没有可预览的内容');
      return;
    }

    setLoadingPreview(true);
    setPreviewOpen(true);
    try {
      const content = await getMaterialContent(material.id);
      setPreviewContent({
        fileName: content.fileName,
        content: content.textContent,
      });
    } catch {
      toast.error('加载预览内容失败');
      setPreviewOpen(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  /**
   * 获取状态配置
   */
  const getStatusConfig = (
    status: string | null | undefined,
    progress?: number
  ) => {
    switch (status) {
      case 'completed':
        return {
          label: '已完成',
          description: '文件处理完成，可以开始生成题目',
          icon: CheckCircle,
          className: 'text-success',
        };
      case 'uploading':
        return {
          label: '上传中',
          description: `正在上传文件到服务器... ${progress || 0}%`,
          icon: Loader2,
          className: 'text-info animate-spin',
        };
      case 'processing':
        return {
          label: 'AI处理中',
          description: `AI正在处理文件... ${progress || 0}%`,
          icon: Loader2,
          className: 'text-info animate-spin',
        };
      case 'extracting':
        return {
          label: '提取文本',
          description: `正在从文件中提取文本内容... ${progress || 0}%`,
          icon: Loader2,
          className: 'text-info animate-spin',
        };
      case 'failed':
        return {
          label: '处理失败',
          description: '文件处理出错，请重新上传',
          icon: AlertCircle,
          className: 'text-destructive',
        };
      default:
        return {
          label: '待处理',
          description: '等待处理',
          icon: FileText,
          className: 'text-muted-foreground',
        };
    }
  };

  // 监听处理中的材料状态
  useEffect(() => {
    for (const material of materials) {
      if (
        material.status === 'processing' ||
        material.status === 'extracting' ||
        material.status === 'uploading'
      ) {
        setProcessingMaterials((prev) => new Set(prev).add(material.id));
      }
    }
  }, [materials]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: MIME_TYPE_EXTENSIONS,
    maxSize: MAX_FILE_SIZE,
    noClick: true, // 禁用点击上传，防止点击文件卡片时触发
    noKeyboard: false,
  });

  return (
    <>
      <div className="flex h-[600px] flex-col overflow-hidden rounded-lg border bg-background">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">材料管理</h3>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {materials.length} 个文件
            </span>
          </div>
        </div>

        {/* 主体区域 - 文件管理器风格 */}
        <div {...getRootProps()} className="relative flex-1 overflow-hidden">
          <input {...getInputProps()} />

          {/* 拖拽提示覆盖层 */}
          {isDragActive && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 animate-pulse text-primary" />
                <p className="font-medium text-lg">释放文件以上传</p>
                <p className="text-muted-foreground text-sm">
                  支持 PDF 和文本文件
                </p>
              </div>
            </div>
          )}

          {/* 文件列表区域 */}
          <ScrollArea className="h-full p-4">
            {isLoading ? (
              <div className="grid gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton className="h-16 w-full rounded-lg" key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center">
                <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
                <p className="font-medium">加载失败</p>
                <p className="text-muted-foreground text-sm">
                  无法加载材料列表，请刷新页面重试
                </p>
              </div>
            ) : materials.length > 0 ? (
              <div className="grid gap-2">
                {materials.map((material) => {
                  const statusConfig = getStatusConfig(
                    material.status,
                    material.progress
                  );
                  const StatusIcon = statusConfig.icon;
                  const isProcessing =
                    material.status === 'processing' ||
                    material.status === 'extracting' ||
                    material.status === 'uploading' ||
                    processingMaterials.has(material.id);

                  return (
                    <div
                      className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                        selectedMaterial?.id === material.id
                          ? 'border-primary bg-accent'
                          : ''
                      }`}
                      key={material.id}
                      onClick={() => setSelectedMaterial(material)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedMaterial(material);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {/* 文件图标 */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* 文件信息 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium text-sm">
                            {material.fileName}
                          </p>
                          <StatusIcon
                            className={`h-4 w-4 ${statusConfig.className}`}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          <span>{material.fileType}</span>
                          <span>•</span>
                          <span>
                            {new Date(material.createdAt).toLocaleDateString(
                              'zh-CN'
                            )}
                          </span>
                          {material.status === 'completed' &&
                            material.hasContent && (
                              <>
                                <span>•</span>
                                <span className="text-success">可用于生题</span>
                              </>
                            )}
                          {isProcessing && (
                            <>
                              <span>•</span>
                              <span className="text-info">
                                {statusConfig.description}
                              </span>
                            </>
                          )}
                          {material.error && (
                            <>
                              <span>•</span>
                              <span className="text-destructive">
                                {material.error}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 操作按钮 - 悬停时显示 */}
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {material.status === 'completed' &&
                          material.hasContent && (
                            <Button
                              className="h-8 w-8 p-0"
                              onClick={(e) => handlePreview(e, material)}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        <Button
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={isProcessing}
                          onClick={(e) => handleDelete(e, material.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* 进度条 */}
                      {material.progress > 0 && material.progress < 100 && (
                        <div className="absolute right-0 bottom-0 left-0 h-1 overflow-hidden rounded-b-lg bg-muted">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${material.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">
                  拖拽文件到此处上传
                </h3>
                <p className="mb-4 text-center text-muted-foreground text-sm">
                  或点击下方按钮选择文件
                </p>
                <Button
                  onClick={() => {
                    // 触发文件选择
                    const input = document.querySelector(
                      'input[type="file"]'
                    ) as HTMLInputElement;
                    input?.click();
                  }}
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  选择文件
                </Button>
                <p className="mt-4 text-center text-muted-foreground text-xs">
                  支持 PDF (.pdf) 和文本文件 (.txt)
                  <br />
                  最大 {MAX_FILE_SIZE / 1024 / 1024}MB
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* 状态栏 */}
        {uploading && (
          <div className="flex items-center gap-2 border-t px-4 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">正在上传文件...</span>
          </div>
        )}
      </div>

      {/* 文件预览对话框 */}
      <Dialog onOpenChange={setPreviewOpen} open={previewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewContent?.fileName || '文件预览'}</DialogTitle>
            <DialogDescription>转录的文本内容</DialogDescription>
          </DialogHeader>
          <div className="relative">
            {loadingPreview ? (
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-96 w-full rounded-md border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {previewContent?.content || '暂无内容'}
                </pre>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
