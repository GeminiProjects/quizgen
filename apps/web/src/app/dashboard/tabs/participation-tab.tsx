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
import { Input } from '@repo/ui/components/input';
import { Skeleton } from '@repo/ui/components/skeleton';
import { ArrowRight, Mic, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import ParticipationStatsCard from '../components/participation-stats-card';
import JoinLectureDialog from '../dialogs/join-lecture-dialog';

interface ParticipationRecord {
  id: string;
  lecture_id: string;
  lecture_title: string;
  lecture_owner_name: string;
  joined_at: string;
  quiz_attempts: number;
  correct_answers: number;
  accuracy_rate: number;
}

/**
 * 参与演讲标签页
 * 显示用户参与的演讲记录，支持通过演讲码加入新演讲
 */
export default function ParticipationTab() {
  const [participationRecords, setParticipationRecords] = useState<
    ParticipationRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // 获取参与记录
  const fetchParticipationRecords = useCallback(() => {
    try {
      // 这里应该调用 API 获取用户参与的演讲记录
      // 暂时使用模拟数据
      const mockData: ParticipationRecord[] = [
        {
          id: '1',
          lecture_id: 'lecture-1',
          lecture_title: 'React 深入浅出',
          lecture_owner_name: '张老师',
          joined_at: '2024-01-15T10:00:00Z',
          quiz_attempts: 8,
          correct_answers: 6,
          accuracy_rate: 75,
        },
        {
          id: '2',
          lecture_id: 'lecture-2',
          lecture_title: 'TypeScript 最佳实践',
          lecture_owner_name: '李老师',
          joined_at: '2024-01-10T14:30:00Z',
          quiz_attempts: 12,
          correct_answers: 10,
          accuracy_rate: 83,
        },
      ];

      setParticipationRecords(mockData);
    } catch (_error) {
      toast.error('获取参与记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 页面加载时获取数据
  useEffect(() => {
    fetchParticipationRecords();
  }, [fetchParticipationRecords]);

  // 格式化时间
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  // 获取准确率颜色
  const getAccuracyColor = (rate: number) => {
    if (rate >= 80) {
      return 'text-green-600';
    }
    if (rate >= 60) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  // 通过演讲码加入演讲
  const handleJoinLecture = async () => {
    if (!joinCode.trim()) {
      toast.error('请输入演讲码');
      return;
    }

    try {
      const response = await fetch('/api/lectures/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ join_code: joinCode.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('成功加入演讲');
        setJoinCode('');
        // 这里可以跳转到演讲页面
        // router.push(`/lectures/${result.data.id}`);
      } else {
        toast.error(result.message || '加入演讲失败');
      }
    } catch (_error) {
      toast.error('网络错误，请稍后重试');
    }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-success text-xl sm:text-2xl">
            参与记录
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            查看您参与的演讲记录和答题表现
          </p>
        </div>
        {participationRecords.length > 0 && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => setShowJoinDialog(true)}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            加入演讲
          </Button>
        )}
      </div>

      {/* 快速加入演讲 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">快速加入演讲</CardTitle>
          <CardDescription>输入演讲码，立即加入正在进行的演讲</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="请输入演讲码（如：ABC123）"
              value={joinCode}
            />
            <Button onClick={handleJoinLecture}>
              <ArrowRight className="mr-1 h-4 w-4" />
              加入
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 参与记录列表 */}
      <div className="grid gap-4">
        {participationRecords.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mic className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">还没有参与任何演讲</h3>
              <p className="mb-4 text-muted-foreground">
                通过演讲码加入演讲，开始您的学习之旅！
              </p>
              <Button onClick={() => setShowJoinDialog(true)}>
                <ArrowRight className="mr-2 h-4 w-4" />
                加入演讲
              </Button>
            </CardContent>
          </Card>
        ) : (
          participationRecords.map((record) => (
            <Card className="transition-shadow hover:shadow-md" key={record.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-1 text-xl">
                      {record.lecture_title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      演讲者：{record.lecture_owner_name}
                    </CardDescription>
                  </div>
                  <Badge
                    className={getAccuracyColor(record.accuracy_rate)}
                    variant="secondary"
                  >
                    准确率 {record.accuracy_rate}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">参与时间</p>
                    <p className="text-sm">
                      {formatDateTime(record.joined_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">答题次数</p>
                    <p className="font-semibold text-sm">
                      {record.quiz_attempts} 次
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">正确答案</p>
                    <p className="font-semibold text-sm">
                      {record.correct_answers} / {record.quiz_attempts}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className="w-full sm:w-auto"
                    size="sm"
                    variant="outline"
                  >
                    <Search className="mr-1 h-4 w-4" />
                    查看详情
                  </Button>

                  <Button
                    className="w-full sm:w-auto"
                    size="sm"
                    variant="outline"
                  >
                    <ArrowRight className="mr-1 h-4 w-4" />
                    再次加入
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 参与统计 */}
      <ParticipationStatsCard records={participationRecords} />

      {/* 加入演讲对话框 */}
      <JoinLectureDialog
        onOpenChange={setShowJoinDialog}
        onSuccess={(lecture) => {
          setShowJoinDialog(false);
          toast.success(`成功加入演讲：${lecture.title}`);
        }}
        open={showJoinDialog}
      />
    </div>
  );
}
