'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Progress } from '@repo/ui/components/progress';
import { cn } from '@repo/ui/lib/utils';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface FileUploadProps {
  lectureId: string;
  onUploadComplete?: (materialId: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'extracting' | 'completed' | 'failed';
  progress: number;
  materialId?: string;
  error?: string;
}

// 支持的文件类型
const SUPPORTED_TYPES = {
  'text/plain': '.txt',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    '.pptx',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/wav': '.wav',
  'audio/m4a': '.m4a',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function FileUpload({
  lectureId,
  onUploadComplete,
  onUploadError,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    if (!Object.keys(SUPPORTED_TYPES).includes(file.type)) {
      return `不支持的文件类型: ${file.type}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024} MB`;
    }
    return null;
  }, []);

  // 更新文件状态
  const updateFileStatus = useCallback(
    (uploadId: string, updates: Partial<UploadingFile>) => {
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadId ? { ...f, ...updates } : f))
      );
    },
    []
  );

  // 处理轮询错误
  const handlePollError = useCallback(
    (uploadId: string, error: unknown) => {
      console.error('Poll status error:', error);
      const errorMessage = error instanceof Error ? error.message : '查询失败';
      updateFileStatus(uploadId, { status: 'failed', error: errorMessage });
      toast.error(errorMessage);
    },
    [updateFileStatus]
  );

  // 轮询文件处理状态
  const pollStatus = useCallback(
    (uploadId: string, materialId: string) => {
      const maxAttempts = 60;
      let attempts = 0;

      const checkStatus = async () => {
        const response = await fetch(`/api/materials/${materialId}/status`);
        if (!response.ok) {
          throw new Error('查询状态失败');
        }
        return response.json();
      };

      const handleStatusUpdate = (data: {
        status: UploadingFile['status'];
        progress: number;
        error?: string;
      }) => {
        updateFileStatus(uploadId, {
          status: data.status,
          progress: data.progress,
          error: data.error,
        });

        if (data.status === 'completed') {
          toast.success('文件处理完成');
          onUploadComplete?.(materialId);
          return true;
        }

        if (data.status === 'failed') {
          throw new Error(data.error || '处理失败');
        }

        return false;
      };

      const poll = async () => {
        try {
          const data = await checkStatus();
          const isComplete = handleStatusUpdate(data);
          if (isComplete) {
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('处理超时');
          }

          setTimeout(poll, 1000);
        } catch (error) {
          handlePollError(uploadId, error);
        }
      };

      poll();
    },
    [onUploadComplete, updateFileStatus, handlePollError]
  );

  // 上传文件
  const uploadFile = useCallback(
    async (file: File) => {
      const uploadId = Math.random().toString(36).substring(7);
      const uploadingFile: UploadingFile = {
        id: uploadId,
        file,
        status: 'uploading',
        progress: 0,
      };

      // 添加到上传列表
      setUploadingFiles((prev) => [...prev, uploadingFile]);

      try {
        // 创建 FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('lectureId', lectureId);

        // 发送上传请求
        const response = await fetch('/api/materials/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '上传失败');
        }

        const result = await response.json();

        // 更新状态为处理中
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadId
              ? {
                  ...f,
                  status: 'processing',
                  progress: 30,
                  materialId: result.materialId,
                }
              : f
          )
        );

        // 开始轮询状态
        pollStatus(uploadId, result.materialId);
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage =
          error instanceof Error ? error.message : '上传失败';

        // 更新状态为失败
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadId
              ? { ...f, status: 'failed', error: errorMessage }
              : f
          )
        );

        toast.error(errorMessage);
        onUploadError?.(
          error instanceof Error ? error : new Error(errorMessage)
        );
      }
    },
    [lectureId, onUploadError, pollStatus]
  );

  // 处理文件选择
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) {
        return;
      }

      for (const file of Array.from(files)) {
        const error = validateFile(file);
        if (error) {
          toast.error(error);
          continue;
        }
        uploadFile(file);
      }
    },
    [uploadFile, validateFile]
  );

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  // 移除已完成或失败的文件
  const removeFile = (uploadId: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
  };

  // 获取状态图标
  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
      case 'extracting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // 获取状态文字
  const getStatusText = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return '上传中...';
      case 'processing':
        return '处理中...';
      case 'extracting':
        return '提取内容中...';
      case 'completed':
        return '完成';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 上传区域 */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-8 w-8" />
          </div>
          <p className="mt-4 font-medium text-lg">拖拽文件到此处上传</p>
          <p className="mt-1 text-muted-foreground text-sm">
            或点击下方按钮选择文件
          </p>
          <p className="mt-2 text-muted-foreground text-xs">
            支持 {Object.values(SUPPORTED_TYPES).join(', ')} 格式，最大 20MB
          </p>
          <Button asChild className="mt-4" variant="outline">
            <label>
              选择文件
              <input
                accept={Object.keys(SUPPORTED_TYPES).join(',')}
                className="hidden"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                type="file"
              />
            </label>
          </Button>
        </CardContent>
      </Card>

      {/* 上传列表 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {getStatusIcon(file.status)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{file.file.name}</p>
                    {(file.status === 'completed' ||
                      file.status === 'failed') && (
                      <Button
                        className="h-6 w-6"
                        onClick={() => removeFile(file.id)}
                        size="icon"
                        variant="ghost"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground text-xs">
                      {getStatusText(file.status)}
                    </p>
                    {file.error && (
                      <p className="text-destructive text-xs">- {file.error}</p>
                    )}
                  </div>
                  {file.status !== 'completed' && file.status !== 'failed' && (
                    <Progress className="h-1" value={file.progress} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
