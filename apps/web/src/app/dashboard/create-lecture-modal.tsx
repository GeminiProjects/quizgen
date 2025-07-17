import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import type React from 'react';

// 类型定义
export type CreateLectureModalProps = {
  open: boolean;
  onClose: () => void;
  lectureTitle: string;
  onLectureTitleChange: (v: string) => void;
  lectureDesc: string;
  onLectureDescChange: (v: string) => void;
  lectureType: 'personal' | 'org';
  onLectureTypeChange: (v: 'personal' | 'org') => void;
  myOrganizations: { id: string | number; name: string }[];
  selectedOrgId: string | null;
  onSelectedOrgIdChange: (v: string) => void;
  orgPassword: string;
  onOrgPasswordChange: (v: string) => void;
  lectureVisibility: 'public' | 'private';
  onLectureVisibilityChange: (v: 'public' | 'private') => void;
  lectureEntryPassword: string;
  onLectureEntryPasswordChange: (v: string) => void;
  lectureStartTime: string;
  onLectureStartTimeChange: (v: string) => void;
  errorMsg: string;
  onCreate: () => void;
};

const CreateLectureModal: React.FC<CreateLectureModalProps> = ({
  open,
  onClose,
  lectureTitle,
  onLectureTitleChange,
  lectureDesc,
  onLectureDescChange,
  lectureType,
  onLectureTypeChange,
  myOrganizations,
  selectedOrgId,
  onSelectedOrgIdChange,
  orgPassword,
  onOrgPasswordChange,
  lectureVisibility,
  onLectureVisibilityChange,
  lectureEntryPassword,
  onLectureEntryPasswordChange,
  lectureStartTime,
  onLectureStartTimeChange,
  errorMsg,
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
        <h2 className="mb-4 font-bold text-lg sm:text-xl">创建演讲</h2>
        <div className="mb-3">
          <label
            className="mb-1 block font-medium text-sm"
            htmlFor="lecture-title"
          >
            演讲标题
          </label>
          <Input
            id="lecture-title"
            onChange={(e) => onLectureTitleChange(e.target.value)}
            placeholder="请输入演讲标题"
            value={lectureTitle}
          />
        </div>
        <div className="mb-3">
          <label
            className="mb-1 block font-medium text-sm"
            htmlFor="lecture-description"
          >
            演讲描述
          </label>
          <Textarea
            id="lecture-description"
            onChange={(e) => onLectureDescChange(e.target.value)}
            placeholder="请输入演讲描述"
            rows={3}
            value={lectureDesc}
          />
        </div>
        <div className="mb-3">
          <fieldset>
            <legend className="mb-1 block font-medium text-sm">演讲类型</legend>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <Input
                  checked={lectureType === 'personal'}
                  className="h-3 w-3"
                  id="lecture-type-personal"
                  name="lectureType"
                  onChange={() => onLectureTypeChange('personal')}
                  type="radio"
                  value="personal"
                />
                <label className="text-sm" htmlFor="lecture-type-personal">
                  个人
                </label>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  checked={lectureType === 'org'}
                  className="h-3 w-3"
                  id="lecture-type-org"
                  name="lectureType"
                  onChange={() => onLectureTypeChange('org')}
                  type="radio"
                  value="org"
                />
                <label className="text-sm" htmlFor="lecture-type-org">
                  组织
                </label>
              </div>
            </div>
          </fieldset>
        </div>
        {lectureType === 'org' && (
          <>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="org-select"
              >
                选择组织
              </label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="org-select"
                onChange={(e) => onSelectedOrgIdChange(e.target.value)}
                value={selectedOrgId || ''}
              >
                <option value="">请选择组织</option>
                {myOrganizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="org-password"
              >
                组织密码
              </label>
              <Input
                id="org-password"
                onChange={(e) => onOrgPasswordChange(e.target.value)}
                placeholder="请输入组织密码"
                type="password"
                value={orgPassword}
              />
            </div>
          </>
        )}
        <div className="mb-3">
          <fieldset>
            <legend className="mb-1 block font-medium text-sm">公开性</legend>
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <Input
                  checked={lectureVisibility === 'public'}
                  className="h-3 w-3"
                  id="lecture-visibility-public"
                  name="lectureVisibility"
                  onChange={() => onLectureVisibilityChange('public')}
                  type="radio"
                  value="public"
                />
                <label className="text-sm" htmlFor="lecture-visibility-public">
                  公开
                </label>
              </div>
              <div className="flex items-center gap-1">
                <Input
                  checked={lectureVisibility === 'private'}
                  className="h-3 w-3"
                  id="lecture-visibility-private"
                  name="lectureVisibility"
                  onChange={() => onLectureVisibilityChange('private')}
                  type="radio"
                  value="private"
                />
                <label className="text-sm" htmlFor="lecture-visibility-private">
                  不公开
                </label>
              </div>
            </div>
          </fieldset>
        </div>
        {lectureVisibility === 'private' && (
          <div className="mb-3">
            <label
              className="mb-1 block font-medium text-sm"
              htmlFor="lecture-entry-password"
            >
              进入密码
            </label>
            <Input
              id="lecture-entry-password"
              onChange={(e) => onLectureEntryPasswordChange(e.target.value)}
              placeholder="请输入进入密码"
              type="password"
              value={lectureEntryPassword}
            />
          </div>
        )}
        <div className="mb-3">
          <label
            className="mb-1 block font-medium text-sm"
            htmlFor="lecture-start-time"
          >
            演讲时间
          </label>
          <Input
            id="lecture-start-time"
            onChange={(e) => onLectureStartTimeChange(e.target.value)}
            required
            type="datetime-local"
            value={lectureStartTime}
          />
        </div>
        {errorMsg && (
          <div className="mb-2 text-destructive text-sm">{errorMsg}</div>
        )}
        <Button className="mt-2 w-full" onClick={onCreate}>
          创建
        </Button>
      </div>
    </div>
  );
};

export default CreateLectureModal;
