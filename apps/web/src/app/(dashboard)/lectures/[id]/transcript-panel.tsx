'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ChevronRight, FileText, Mic, MicOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Transcript } from '@/types';
import TranscriptDialog from './transcript-dialog';

interface TranscriptPanelProps {
  lectureId: string;
  isActive: boolean;
}

/**
 * TODO
 *
 * 实时转录面板组件
 * 显示麦克风状态和转录内容
 */
export default function TranscriptPanel({
  lectureId,
  isActive,
}: TranscriptPanelProps) {
  const [isMicEnabled, _setIsMicEnabled] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);

  // 模拟麦克风音量变化
  useEffect(() => {
    if (!(isActive && isMicEnabled)) {
      return;
    }

    const interval = setInterval(() => {
      // 生成随机音量值
      setMicVolume(Math.random() * 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, isMicEnabled]);

  // 模拟转录数据
  useEffect(() => {
    if (!isActive) {
      return;
    }

    // 添加一些示例转录
    const demoTranscripts: Transcript[] = [
      {
        id: '1',
        lecture_id: lectureId,
        text: '大家好，欢迎参加今天的演讲。',
        ts: new Date(Date.now() - 60_000).toISOString(),
        created_at: new Date(Date.now() - 60_000).toISOString(),
      },
      {
        id: '2',
        lecture_id: lectureId,
        text: '今天我们要讨论的主题是现代软件开发的最佳实践。',
        ts: new Date(Date.now() - 30_000).toISOString(),
        created_at: new Date(Date.now() - 30_000).toISOString(),
      },
      {
        id: '3',
        lecture_id: lectureId,
        text: '首先，让我们从代码质量开始说起...',
        ts: new Date(Date.now() - 10_000).toISOString(),
        created_at: new Date(Date.now() - 10_000).toISOString(),
      },
    ];
    setTranscripts(demoTranscripts);
  }, [isActive, lectureId]);

  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);

  // 获取最新的转录文本
  const latestTranscript = transcripts.at(-1);
  const displayText =
    latestTranscript?.text ||
    (isActive ? '等待转录内容...' : '开始演讲后显示转录内容');

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>实时转录</CardTitle>
              <CardDescription>麦克风状态和转录内容监控</CardDescription>
            </div>
            <Badge
              className={
                isMicEnabled ? 'bg-success text-success-foreground' : ''
              }
              variant="secondary"
            >
              {isMicEnabled ? '麦克风已启用' : '麦克风未启用'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 麦克风状态栏 */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                  isMicEnabled
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isMicEnabled ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {isActive ? '正在录制' : '准备就绪'}
                </p>
                <div className="mt-1 flex items-center gap-4">
                  <span className="text-muted-foreground text-xs">
                    输入音量: {Math.round(micVolume)}%
                  </span>
                  {/* 迷你音量条 */}
                  <div className="relative h-1 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute top-0 left-0 h-full bg-success transition-all duration-100"
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 最新转录内容预览 */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">最新转录</span>
                {transcripts.length > 0 && (
                  <Badge className="text-xs" variant="secondary">
                    {transcripts.length} 条记录
                  </Badge>
                )}
              </div>
              <Button
                className="text-xs"
                onClick={() => setShowTranscriptDialog(true)}
                size="sm"
                variant="ghost"
              >
                查看全部
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <p className="line-clamp-2 text-muted-foreground text-sm">
              {displayText}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 转录内容弹窗 */}
      <TranscriptDialog
        isActive={isActive}
        onOpenChange={setShowTranscriptDialog}
        open={showTranscriptDialog}
        transcripts={transcripts}
      />
    </>
  );
}
