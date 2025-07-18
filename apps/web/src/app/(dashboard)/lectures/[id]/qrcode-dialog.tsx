'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  joinCode: string;
}

/**
 * 二维码弹窗组件
 * 展示加入演讲的二维码
 */
export default function QRCodeDialog({
  open,
  onOpenChange,
  joinCode,
}: QRCodeDialogProps) {
  // 模拟二维码生成
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (open) {
      // 这里暂时使用占位符，实际应该生成真实的二维码
      const placeholderQR = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        `https://quizgen.app/join/${joinCode}`
      )}`;
      setQrCodeUrl(placeholderQR);
    }
  }, [open, joinCode]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            扫码加入演讲
          </DialogTitle>
          <DialogDescription>
            参与者可以扫描二维码或输入加入码加入演讲
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* 二维码图片 */}
          <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed bg-muted/10">
            {qrCodeUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* biome-ignore lint/performance/noImgElement: 二维码是外部API生成，无需优化 */}
                <img
                  alt="演讲二维码"
                  className="h-full w-full rounded-lg"
                  src={qrCodeUrl}
                />
              </>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <QrCode className="mb-2 h-12 w-12" />
                <p className="text-sm">生成中...</p>
              </div>
            )}
          </div>

          {/* 加入码 */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">加入码</p>
            <p className="font-bold font-mono text-2xl">{joinCode}</p>
          </div>

          {/* 开发提示 */}
          <div className="rounded-lg bg-warning/10 p-3 text-center">
            <p className="text-sm text-warning">
              🚧 功能开发中，暂时使用演示二维码
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
