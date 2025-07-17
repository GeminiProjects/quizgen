import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import type React from 'react';

export type CreateOrgModalProps = {
  open: boolean;
  onClose: () => void;
  orgName: string;
  onOrgNameChange: (v: string) => void;
  orgDesc: string;
  onOrgDescChange: (v: string) => void;
  orgCreatePassword: string;
  onOrgCreatePasswordChange: (v: string) => void;
  orgErrorMsg: string;
  onCreate: () => void;
};

const CreateOrgModal: React.FC<CreateOrgModalProps> = ({
  open,
  onClose,
  orgName,
  onOrgNameChange,
  orgDesc,
  onOrgDescChange,
  orgCreatePassword,
  onOrgCreatePasswordChange,
  orgErrorMsg,
  onCreate,
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
          onClick={onClose}
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
        <h2 className="mb-4 font-bold text-lg sm:text-xl">创建组织</h2>
        <div className="mb-3">
          <label className="mb-1 block font-medium text-sm" htmlFor="org-name">
            组织名称
          </label>
          <Input
            id="org-name"
            onChange={(e) => onOrgNameChange(e.target.value)}
            placeholder="请输入组织名称"
            value={orgName}
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block font-medium text-sm" htmlFor="org-desc">
            组织简述
          </label>
          <Textarea
            id="org-desc"
            onChange={(e) => onOrgDescChange(e.target.value)}
            placeholder="请输入组织简述"
            rows={3}
            value={orgDesc}
          />
        </div>
        <div className="mb-3">
          <label
            className="mb-1 block font-medium text-sm"
            htmlFor="org-create-password"
          >
            组织密码
          </label>
          <Input
            id="org-create-password"
            onChange={(e) => onOrgCreatePasswordChange(e.target.value)}
            placeholder="请输入组织密码"
            type="password"
            value={orgCreatePassword}
          />
        </div>
        {orgErrorMsg && (
          <div className="mb-2 text-destructive text-sm">{orgErrorMsg}</div>
        )}
        <Button className="mt-2 w-full" onClick={onCreate}>
          创建
        </Button>
      </div>
    </div>
  );
};

export default CreateOrgModal;
