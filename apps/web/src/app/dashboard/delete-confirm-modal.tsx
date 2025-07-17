import { Button } from '@repo/ui/components/button';
import type React from 'react';

export type DeleteConfirmModalProps = {
  open: boolean;
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  text,
  onConfirm,
  onCancel,
}) => {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-card p-4 shadow-lg sm:mx-0 sm:p-6">
        <button
          aria-label="关闭"
          className="absolute top-2 right-2 rounded-sm p-1 text-muted-foreground transition-opacity hover:text-foreground hover:opacity-100"
          onClick={onCancel}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>
        <h2 className="mb-4 text-center font-bold text-lg sm:text-xl">
          {text}
        </h2>
        <div className="mt-2 flex justify-center gap-4">
          <Button className="w-24" onClick={onConfirm} variant="destructive">
            确定
          </Button>
          <Button className="w-24" onClick={onCancel} variant="outline">
            取消
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
