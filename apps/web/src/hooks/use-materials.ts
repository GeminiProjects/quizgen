/**
 * SWR hook 管理材料上传和状态
 */
import { mutate } from 'swr';

export interface Material {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  progress: number;
  hasContent: boolean;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialsData {
  materials: Material[];
}

/**
 * 获取材料列表的 SWR key
 */
export function getMaterialsKey(lectureId: string) {
  return `/api/materials?lectureId=${lectureId}`;
}

/**
 * 刷新材料列表
 */
export function refreshMaterials(lectureId: string) {
  return mutate(getMaterialsKey(lectureId));
}

/**
 * 上传文件到服务器
 */
export async function uploadFile(
  file: File,
  lectureId: string
): Promise<{ materialId: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('lectureId', lectureId);

  const response = await fetch('/api/materials/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '上传失败');
  }

  return response.json();
}

/**
 * 轮询材料处理状态
 */
export function pollMaterialStatus(
  materialId: string,
  options?: {
    maxAttempts?: number;
    interval?: number;
    onProgress?: (status: string, progress: number) => void;
  }
): Promise<{
  status: string;
  progress: number;
  textContent?: string;
  error?: string;
}> {
  const { maxAttempts = 60, interval = 1000, onProgress } = options || {};

  let attempts = 0;

  const poll = async (): Promise<{
    status: string;
    progress: number;
    textContent?: string;
    error?: string;
  }> => {
    const response = await fetch(`/api/materials/${materialId}/status`);
    if (!response.ok) {
      throw new Error('查询状态失败');
    }

    const data = await response.json();

    // 通知进度
    onProgress?.(data.status, data.progress);

    // 检查是否完成或失败
    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }

    // 继续轮询
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('处理超时');
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    return poll();
  };

  return poll();
}

/**
 * 删除材料
 */
export async function deleteMaterial(materialId: string): Promise<void> {
  const response = await fetch(`/api/materials/${materialId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '删除失败');
  }
}

/**
 * 获取材料内容
 */
export async function getMaterialContent(materialId: string): Promise<{
  id: string;
  fileName: string;
  fileType: string;
  textContent: string;
}> {
  const response = await fetch(`/api/materials/${materialId}/status`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '获取内容失败');
  }

  const data = await response.json();
  return {
    id: data.id,
    fileName: data.fileName,
    fileType: data.fileType,
    textContent: data.textContent || '',
  };
}
