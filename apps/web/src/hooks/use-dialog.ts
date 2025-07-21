import { useState } from 'react';

/**
 * 对话框状态管理 Hook
 * 统一管理对话框的开关状态和加载状态
 */
export function useDialog(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const [loading, setLoading] = useState(false);

  const openDialog = () => setOpen(true);
  const closeDialog = () => {
    setOpen(false);
    setLoading(false);
  };

  return {
    open,
    setOpen,
    loading,
    setLoading,
    openDialog,
    closeDialog,
  };
}
