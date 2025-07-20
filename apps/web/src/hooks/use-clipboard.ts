import { useState } from 'react';
import { toast } from 'sonner';

/**
 * 剪贴板操作 Hook
 * 统一处理复制到剪贴板的功能
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (
    text: string,
    successMessage = '已复制到剪贴板',
    errorMessage = '复制失败'
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      toast.error(errorMessage);
      return false;
    }
  };

  return {
    copied,
    copyToClipboard,
  };
}
