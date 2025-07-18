'use client';

import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Copy, Eye, EyeOff, Pause, Play, QrCode, Timer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import QRCodeDialog from './qrcode-dialog';
import TranscriptPanel from './transcript-panel';

interface LectureControlSectionProps {
  lectureId: string;
  joinCode: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'ended';
  loading: boolean;
  onStatusChange: (action: 'start' | 'pause' | 'end') => void;
}

/**
 * 演讲控制部分组件
 */
export default function LectureControlSection({
  lectureId,
  joinCode,
  status,
  loading,
  onStatusChange,
}: LectureControlSectionProps) {
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);

  /**
   * 复制加入码到剪贴板
   */
  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      toast.success('加入码已复制');
    } catch (_error) {
      toast.error('复制失败');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>加入码</CardTitle>
          <CardDescription>听众通过此码加入演讲</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                className="pr-20 font-mono text-lg"
                readOnly
                type={showJoinCode ? 'text' : 'password'}
                value={joinCode}
              />
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                <Button
                  className="h-7 w-7 p-0"
                  onClick={() => setShowJoinCode(!showJoinCode)}
                  size="sm"
                  variant="ghost"
                >
                  {showJoinCode ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  className="h-7 w-7 p-0"
                  onClick={copyJoinCode}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <Button
              onClick={() => setShowQRDialog(true)}
              size="icon"
              variant="outline"
            >
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            听众可以通过输入加入码或扫描二维码加入演讲
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>演讲控制</CardTitle>
          <CardDescription>控制演讲的进行状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'not_started' && (
            <Button
              className="w-full"
              disabled={loading}
              onClick={() => onStatusChange('start')}
              size="lg"
            >
              <Play className="mr-2 h-4 w-4" />
              开始演讲
            </Button>
          )}
          {status === 'in_progress' && (
            <div className="grid gap-2">
              <Button
                className="w-full"
                disabled={loading}
                onClick={() => onStatusChange('pause')}
                size="lg"
                variant="secondary"
              >
                <Pause className="mr-2 h-4 w-4" />
                暂停演讲
              </Button>
              <Button
                className="w-full"
                disabled={loading}
                onClick={() => onStatusChange('end')}
                size="lg"
                variant="destructive"
              >
                <Timer className="mr-2 h-4 w-4" />
                结束演讲
              </Button>
            </div>
          )}
          {status === 'paused' && (
            <div className="grid gap-2">
              <Button
                className="w-full"
                disabled={loading}
                onClick={() => onStatusChange('start')}
                size="lg"
              >
                <Play className="mr-2 h-4 w-4" />
                继续演讲
              </Button>
              <Button
                className="w-full"
                disabled={loading}
                onClick={() => onStatusChange('end')}
                size="lg"
                variant="destructive"
              >
                <Timer className="mr-2 h-4 w-4" />
                结束演讲
              </Button>
            </div>
          )}
          {status === 'ended' && (
            <div className="text-center text-muted-foreground">演讲已结束</div>
          )}
        </CardContent>
      </Card>

      {/* 实时转录面板 */}
      {(status === 'in_progress' || status === 'paused') && (
        <TranscriptPanel
          isActive={status === 'in_progress'}
          lectureId={lectureId}
        />
      )}

      {/* 二维码弹窗 */}
      <QRCodeDialog
        joinCode={joinCode}
        onOpenChange={setShowQRDialog}
        open={showQRDialog}
      />
    </>
  );
}
