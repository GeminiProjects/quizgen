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
import { Skeleton } from '@repo/ui/components/skeleton';
import { Eye, Pause, Play, Plus, Presentation, Square } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import LectureStatsCard from '../components/lecture-stats-card';
import CreateLectureDialog from '../dialogs/create-lecture-dialog';

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'paused' | 'ended';
  join_code: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  org_id: string | null;
}

/**
 * 演讲管理标签页
 * 显示用户创建的演讲列表，支持创建、管理演讲
 */
export default function LecturesTab() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [_selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  // 获取演讲列表
  const fetchLectures = useCallback(async () => {
    try {
      const response = await fetch('/api/lectures');
      const result = await response.json();

      if (result.success) {
        setLectures(result.data.data);
      } else {
        toast.error(result.message || '获取演讲列表失败');
      }
    } catch (_error) {
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 页面加载时获取数据
  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  // 获取状态显示文本和颜色
  const getStatusBadge = (status: Lecture['status']) => {
    const statusMap = {
      not_started: { text: '未开始', variant: 'secondary' as const },
      in_progress: { text: '进行中', variant: 'default' as const },
      paused: { text: '已暂停', variant: 'outline' as const },
      ended: { text: '已结束', variant: 'destructive' as const },
    };
    return statusMap[status];
  };

  // 格式化时间
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  // 创建演讲成功后的回调
  const handleLectureCreated = (newLecture: Lecture) => {
    setLectures((prev) => [newLecture, ...prev]);
    setShowCreateDialog(false);
    toast.success('演讲创建成功');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-info">我的演讲</h2>
          <p className="text-muted-foreground">
            管理您创建的演讲，查看演讲状态和参与情况
          </p>
        </div>
        {lectures.length > 0 && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建演讲
          </Button>
        )}
      </div>

      {/* 演讲列表 */}
      <div className="grid gap-4">
        {lectures.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Presentation className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">还没有创建任何演讲</h3>
              <p className="mb-4 text-muted-foreground">
                创建您的第一个演讲，开始与观众的互动吧！
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                创建演讲
              </Button>
            </CardContent>
          </Card>
        ) : (
          lectures.map((lecture) => (
            <Card
              className="transition-shadow hover:shadow-md"
              key={lecture.id}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-1 text-xl">
                      {lecture.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {lecture.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <Badge {...getStatusBadge(lecture.status)}>
                    {getStatusBadge(lecture.status).text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">演讲码</p>
                    <p className="font-bold font-mono text-lg">
                      {lecture.join_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">开始时间</p>
                    <p className="text-sm">
                      {formatDateTime(lecture.starts_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSelectedLecture(lecture)}
                    size="sm"
                    variant="outline"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    查看详情
                  </Button>

                  {lecture.status === 'not_started' && (
                    <Button size="sm">
                      <Play className="mr-1 h-4 w-4" />
                      开始演讲
                    </Button>
                  )}

                  {lecture.status === 'in_progress' && (
                    <Button size="sm" variant="outline">
                      <Pause className="mr-1 h-4 w-4" />
                      暂停演讲
                    </Button>
                  )}

                  {lecture.status === 'paused' && (
                    <Button size="sm">
                      <Play className="mr-1 h-4 w-4" />
                      继续演讲
                    </Button>
                  )}

                  {(lecture.status === 'in_progress' ||
                    lecture.status === 'paused') && (
                    <Button size="sm" variant="destructive">
                      <Square className="mr-1 h-4 w-4" />
                      结束演讲
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 演讲统计 */}
      <LectureStatsCard lectures={lectures} />

      {/* 创建演讲对话框 */}
      <CreateLectureDialog
        onOpenChange={setShowCreateDialog}
        onSuccess={handleLectureCreated}
        open={showCreateDialog}
      />
    </div>
  );
}
