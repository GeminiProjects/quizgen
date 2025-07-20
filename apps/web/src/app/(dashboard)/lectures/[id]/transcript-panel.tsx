'use client';

import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Transcript } from '@/types';

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

  /**
   * 格式化时间戳
   */
  const formatTimestamp = (date: string) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 麦克风状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>麦克风状态</span>
            <Badge
              className={
                isMicEnabled ? 'bg-success text-success-foreground' : ''
              }
              variant="secondary"
            >
              {isMicEnabled ? '已启用' : '未启用'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 麦克风图标和状态 */}
          <div className="flex items-center justify-center py-4">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${
                isMicEnabled
                  ? 'bg-success/10 text-success'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isMicEnabled ? (
                <Mic className="h-12 w-12" />
              ) : (
                <MicOff className="h-12 w-12" />
              )}
            </div>
          </div>

          {/* 音量指示器 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">输入音量</span>
              <span className="font-medium">{Math.round(micVolume)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="absolute top-0 left-0 h-full bg-success transition-all duration-100"
                style={{ width: `${micVolume}%` }}
              />
            </div>
          </div>

          {/* 提示信息 */}
          <div className="rounded-lg bg-info/10 p-3">
            <p className="flex items-center gap-2 text-info text-sm">
              <Volume2 className="h-4 w-4" />
              {isActive
                ? '正在实时转录您的演讲内容'
                : '开始演讲后将自动启用麦克风'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 转录内容 */}
      <Card>
        <CardHeader>
          <CardTitle>实时转录</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full rounded-lg border p-4">
            {transcripts.length > 0 ? (
              <div className="space-y-3">
                {transcripts.map((transcript) => (
                  <div className="space-y-1" key={transcript.id}>
                    <p className="text-muted-foreground text-xs">
                      {formatTimestamp(transcript.created_at)}
                    </p>
                    <p className="text-sm leading-relaxed">{transcript.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-muted-foreground">
                  {isActive ? '等待转录内容...' : '开始演讲后显示转录内容'}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
