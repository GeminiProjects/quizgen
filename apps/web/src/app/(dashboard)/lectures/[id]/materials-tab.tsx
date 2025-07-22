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
import { Progress } from '@repo/ui/components/progress';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { deleteMaterial, getMaterials } from '@/app/actions/materials';
import { uploadMaterial } from '@/app/actions/materials-upload';
import type { Material } from '@/types';
import { materialStatusConfig } from '@/types';

/**
 * 材料项的处理状态
 */
interface MaterialProcessingState {
  /** 开始处理的时间戳 */
  startTime: number;
  /** 经过的秒数 */
  elapsedSeconds: number;
  /** 实时提取的文本内容 */
  streamedContent?: string;
  /** 处理进度 (0-100) */
  progress: number;
}

/**
 * 材料准备标签页组件 - 增强版
 * 支持文件上传、预览、管理，以及实时处理状态显示
 */
export default function MaterialsTab({ lectureId }: { lectureId: string }) {
  // SSE 连接管理
  const sseConnections = useMemo(() => new Map<string, EventSource>(), []);
  const [uploading, setUploading] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 处理状态管理
  const [processingStates, setProcessingStates] = useState<
    Map<string, MaterialProcessingState>
  >(new Map());

  /**
   * 检查并报告被删除的材料（处理失败）
   */
  const checkDeletedMaterials = useCallback(
    (oldMaterials: Material[], newMaterials: Material[]) => {
      if (oldMaterials.length === 0) {
        return;
      }

      const newIds = new Set(newMaterials.map((m) => m.id));
      const deletedMaterials = oldMaterials.filter(
        (m) => !newIds.has(m.id) && m.status !== 'completed'
      );

      for (const m of deletedMaterials) {
        // 失败的材料会被自动删除
        toast.error(`${m.file_name} 处理失败，已自动删除`);
        // 清理处理状态
        setProcessingStates((prev) => {
          const next = new Map(prev);
          next.delete(m.id);
          return next;
        });
      }
    },
    []
  );

  /**
   * 刷新材料列表
   */
  const refreshMaterials = useCallback(
    async (showError = true) => {
      setRefreshing(true);
      try {
        // 使用 Server Action 获取材料列表
        const result = await getMaterials(lectureId);

        if (result.success && result.data) {
          const newMaterials = result.data;

          // 检测删除的材料（处理失败的会被自动删除）
          checkDeletedMaterials(materials, newMaterials);
          setMaterials(newMaterials);

          // 更新处理状态
          for (const material of newMaterials) {
            if (material.status === 'processing') {
              // 如果材料正在处理中，初始化或更新处理状态
              setProcessingStates((prev) => {
                const next = new Map(prev);
                if (!next.has(material.id)) {
                  next.set(material.id, {
                    startTime: Date.now(),
                    elapsedSeconds: 0,
                    progress: 0,
                  });
                }
                return next;
              });
            } else if (
              material.status === 'completed' ||
              material.status === 'timeout'
            ) {
              // 清理已完成或超时的处理状态
              setProcessingStates((prev) => {
                const next = new Map(prev);
                next.delete(material.id);
                return next;
              });
            }
          }
        } else if (!result.success && showError) {
          toast.error('加载材料列表失败');
        }
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

  /**
   * 初始加载材料列表
   */
  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true);
      try {
        // 使用 Server Action 获取材料列表
        const result = await getMaterials(lectureId);

        if (result.success && result.data) {
          setMaterials(result.data);

          // 初始化处理状态
          for (const material of result.data) {
            if (material.status === 'processing') {
              setProcessingStates((prev) => {
                const next = new Map(prev);
                next.set(material.id, {
                  startTime: Date.now(),
                  elapsedSeconds: 0,
                  progress: 0,
                });
                return next;
              });
            }
          }
        } else {
          toast.error('加载材料列表失败');
        }
      } catch (error) {
        console.error('Failed to load materials:', error);
        toast.error('加载材料列表失败');
      } finally {
        setLoading(false);
      }
    };
    loadMaterials();
  }, [lectureId]);

  /**
   * 处理时间计时器
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setProcessingStates((prev) => {
        const next = new Map(prev);
        for (const [id, state] of next) {
          next.set(id, {
            ...state,
            elapsedSeconds: Math.floor((Date.now() - state.startTime) / 1000),
          });
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * 轮询检查处理中的材料
   */
  useEffect(() => {
    // 检查是否有处理中的材料
    const hasProcessingMaterials = materials.some(
      (m) => m.status === 'processing'
    );

    if (hasProcessingMaterials) {
      // 每3秒刷新一次
      const interval = setInterval(() => {
        refreshMaterials(false);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [materials, refreshMaterials]);

  /**
   * 启动 SSE 连接监听材料处理进度
   */
  const startSSEConnection = useCallback(
    (materialId: string) => {
      // 如果已经有连接，先关闭
      const existingConnection = sseConnections.get(materialId);
      if (existingConnection) {
        existingConnection.close();
        sseConnections.delete(materialId);
      }

      // 创建新的 SSE 连接
      const eventSource = new EventSource(
        `/api/materials/${materialId}/stream`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'update':
              // 更新处理状态
              setProcessingStates((prev) => {
                const next = new Map(prev);
                const state = next.get(materialId);
                if (state) {
                  next.set(materialId, {
                    ...state,
                    progress: data.progress,
                    elapsedSeconds: data.elapsedSeconds,
                  });
                }
                return next;
              });
              break;

            case 'content':
              // 更新流式内容
              setProcessingStates((prev) => {
                const next = new Map(prev);
                const state = next.get(materialId);
                if (state) {
                  next.set(materialId, {
                    ...state,
                    streamedContent:
                      (state.streamedContent || '') + data.content,
                  });
                }
                return next;
              });
              break;

            case 'complete':
              // 处理完成
              toast.success('材料处理完成');
              eventSource.close();
              sseConnections.delete(materialId);

              // 刷新材料列表
              refreshMaterials(false);
              break;

            case 'error':
            case 'timeout':
              // 错误或超时
              toast.error(data.message || '处理失败');
              eventSource.close();
              sseConnections.delete(materialId);

              // 刷新材料列表
              refreshMaterials(false);
              break;

            default:
              // 忽略未知类型
              break;
          }
        } catch (error) {
          console.error('SSE message error:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        sseConnections.delete(materialId);
      };

      // 保存连接
      sseConnections.set(materialId, eventSource);
    },
    [sseConnections, refreshMaterials]
  );

  /**
   * 处理文件上传
   */
  const handleUpload = useCallback(
    async (files: File[]) => {
      setUploading(true);

      try {
        for (const file of files) {
          // 1. 读取文件内容为 Base64
          const reader = new FileReader();
          const fileData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const base64 = reader.result as string;
              // 移除 data:xxx;base64, 前缀
              const base64Data = base64.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // 2. 创建材料记录
          const result = await uploadMaterial({
            lectureId,
            fileName: file.name,
            fileType: file.type,
            fileData,
          });

          if (result.success && result.data) {
            toast.success(`${file.name} 上传成功，正在处理中...`);

            // 3. 启动 SSE 连接监听处理进度
            const material = result.data;
            startSSEConnection(material.id);

            // 立即添加到列表
            setMaterials((prev) => [material, ...prev]);

            // 初始化处理状态
            setProcessingStates((prev) => {
              const next = new Map(prev);
              next.set(material.id, {
                startTime: Date.now(),
                elapsedSeconds: 0,
                progress: 0,
              });
              return next;
            });
          } else {
            toast.error(`${file.name} 上传失败`);
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '上传失败');
      } finally {
        setUploading(false);
      }
    },
    [lectureId, startSSEConnection]
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
  const handlePreview = (material: Material) => {
    if (material.text_content) {
      setPreviewContent(material.text_content);
      setPreviewFileName(material.file_name);
      setShowPreview(true);
    } else {
      toast.error('该材料暂无可预览的内容');
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
      (acc: { [key: string]: string[] }, mimeType) => {
        acc[mimeType] = MIME_TYPE_EXTENSIONS[mimeType] || [];
        return acc;
      },
      {} as { [key: string]: string[] }
    ),
    maxSize: MAX_FILE_SIZE,
    disabled: uploading,
  });

  /**
   * 组件卸载时关闭所有 SSE 连接
   */
  useEffect(() => {
    return () => {
      for (const [_id, connection] of sseConnections) {
        connection.close();
      }
      sseConnections.clear();
    };
  }, [sseConnections]);

  /**
   * 格式化处理时间
   */
  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} secs`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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
          {materials.some((m) => m.status === 'processing') && (
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
            const isDeleting = deletingIds.has(material.id);
            const processingState = processingStates.get(material.id);

            return (
              <div
                className="group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-sm"
                key={material.id}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* 文件图标 */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
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
                  {material.status === 'completed' ? (
                    <div
                      className={`flex items-center gap-2 ${materialStatusConfig.completed.className}`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {materialStatusConfig.completed.label}
                      </span>
                    </div>
                  ) : material.status === 'timeout' ? (
                    <div
                      className={`flex items-center gap-2 ${materialStatusConfig.timeout.className}`}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {materialStatusConfig.timeout.label}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center gap-2 ${materialStatusConfig.processing.className}`}
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {materialStatusConfig.processing.label}
                        {processingState &&
                          ` (${formatElapsedTime(processingState.elapsedSeconds)})`}
                      </span>
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
                      disabled={isDeleting || material.status === 'processing'}
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

                {/* 处理进度条和实时内容预览 */}
                {material.status === 'processing' && processingState && (
                  <div className="space-y-3 border-t bg-muted/20 p-4">
                    {/* 进度条 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">处理进度</span>
                        <span className="font-medium">
                          {processingState.progress}%
                        </span>
                      </div>
                      <Progress
                        className="h-2"
                        value={processingState.progress}
                      />
                    </div>

                    {/* 实时提取的内容预览 */}
                    {processingState.streamedContent && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-sm">
                          正在提取的内容：
                        </p>
                        <div className="max-h-32 overflow-y-auto rounded-md bg-muted/50 p-3">
                          <pre className="whitespace-pre-wrap font-mono text-muted-foreground text-xs">
                            {processingState.streamedContent}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
