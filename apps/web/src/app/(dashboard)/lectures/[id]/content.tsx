'use client';

import type { Lecture } from '@repo/db';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import {
  ChartBar,
  Edit,
  FileText,
  Hash,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Pause,
  Play,
  Timer,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { StatsCard } from '@/components/stats-card';
import { useLectureActions } from '@/hooks/use-lectures';
import { getMaterialsKey, type MaterialsData } from '@/hooks/use-materials';
import { lectureStatusConfig } from '@/types/lecture';
import DeleteLectureDialog from './delete-lecture-dialog';
import EditLectureDialog from './edit-lecture-dialog';
import LectureControlSection from './lecture-control-section';
import MaterialsTab from './materials-tab';
import QuizTestTab from './quiz-test-tab';

interface QuizItemWithDate {
  id: string;
  created_at: string | Date;
  lecture_id: string;
  ts: Date;
  question: string;
  options: string[];
  answer: number;
  question_type?: string;
  correct_answer?: string;
  explanation?: string | null;
  _count?: {
    attempts: number;
    correctAttempts: number;
  };
}

interface LectureWithQuizItems extends Lecture {
  quizItems?: QuizItemWithDate[];
}

interface LectureDetailClientProps {
  lecture: LectureWithQuizItems;
  stats: {
    totalParticipants: number;
    totalQuizItems: number;
    totalTranscripts: number;
    totalMaterials: number;
    contextSize: number;
    avgResponseTime: number;
  };
}

/**
 * 演讲详情客户端组件
 */
export default function LectureDetailContent({
  lecture,
  stats,
}: LectureDetailClientProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { startLecture, pauseLecture, endLecture } = useLectureActions();

  // 获取材料数据
  const { data: materialsData } = useSWR<MaterialsData>(
    getMaterialsKey(lecture.id),
    (url: string) => fetch(url).then((res) => res.json()),
    {
      refreshInterval: 5000, // 每5秒刷新一次
    }
  );

  const materials = materialsData?.materials || [];

  /**
   * 格式化日期
   */
  const formatDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * 格式化相对时间
   */
  const _formatRelativeTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return '今天';
    }
    if (diffInHours < 48) {
      return '昨天';
    }
    if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}天前`;
    }
    return formatDate(dateStr);
  };

  /**
   * 计算演讲时长
   */
  const _calculateDuration = () => {
    if (!lecture.ends_at) {
      return '进行中';
    }
    const start = new Date(lecture.starts_at);
    const end = new Date(lecture.ends_at);
    const diffInMinutes = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60)
    );
    if (diffInMinutes < 60) {
      return `${diffInMinutes} 分钟`;
    }
    return `${Math.floor(diffInMinutes / 60)} 小时 ${diffInMinutes % 60} 分钟`;
  };

  /**
   * 处理状态变更
   */
  const handleStatusChange = async (action: 'start' | 'pause' | 'end') => {
    setLoading(true);
    try {
      switch (action) {
        case 'start':
          await startLecture(lecture.id);
          toast.success('演讲已开始');
          break;
        case 'pause':
          await pauseLecture(lecture.id);
          toast.success('演讲已暂停');
          break;
        case 'end':
          await endLecture(lecture.id);
          toast.success('演讲已结束');
          break;
        default:
          throw new Error('未知操作');
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算平均答对率
  const avgCorrectRate =
    stats.totalQuizItems > 0
      ? Math.round(
          ((lecture.quizItems?.reduce((sum, item) => {
            const total = item._count?.attempts || 0;
            const correct = item._count?.correctAttempts || 0;
            return sum + (total > 0 ? correct / total : 0);
          }, 0) || 0) /
            stats.totalQuizItems) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <BreadcrumbNav
        items={[{ label: '演讲', href: '/lectures' }, { label: lecture.title }]}
      />

      {/* 页面头部 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl">{lecture.title}</h1>
            <Badge
              className={lectureStatusConfig[lecture.status].className}
              variant={lectureStatusConfig[lecture.status].variant}
            >
              {lectureStatusConfig[lecture.status].label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {lecture.description || '暂无描述'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {lecture.status === 'not_started' && (
              <DropdownMenuItem
                disabled={loading}
                onClick={() => handleStatusChange('start')}
              >
                <Play className="mr-2 h-4 w-4" />
                开始演讲
              </DropdownMenuItem>
            )}
            {lecture.status === 'in_progress' && (
              <>
                <DropdownMenuItem
                  disabled={loading}
                  onClick={() => handleStatusChange('pause')}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  暂停演讲
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={loading}
                  onClick={() => handleStatusChange('end')}
                >
                  <Timer className="mr-2 h-4 w-4" />
                  结束演讲
                </DropdownMenuItem>
              </>
            )}
            {lecture.status === 'paused' && (
              <>
                <DropdownMenuItem
                  disabled={loading}
                  onClick={() => handleStatusChange('start')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  继续演讲
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={loading}
                  onClick={() => handleStatusChange('end')}
                >
                  <Timer className="mr-2 h-4 w-4" />
                  结束演讲
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              编辑信息
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              删除演讲
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 标签页 */}
      <Tabs className="space-y-6" defaultValue="control">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="control">演讲面板</TabsTrigger>
          <TabsTrigger value="materials">材料准备</TabsTrigger>
          <TabsTrigger value="quiz">测试生题</TabsTrigger>
          <TabsTrigger value="details">详细信息</TabsTrigger>
        </TabsList>

        {/* 演讲面板 */}
        <TabsContent className="space-y-6" value="control">
          <LectureControlSection
            joinCode={lecture.join_code}
            lectureId={lecture.id}
            loading={loading}
            onStatusChange={handleStatusChange}
            status={lecture.status}
          />
        </TabsContent>

        {/* 材料准备 */}
        <TabsContent className="space-y-4" value="materials">
          <MaterialsTab lectureId={lecture.id} />
        </TabsContent>

        {/* 测试生题 */}
        <TabsContent className="space-y-4" value="quiz">
          <QuizTestTab
            lectureId={lecture.id}
            materials={materials}
            transcripts={[]}
          />
        </TabsContent>

        {/* 详细信息 */}
        <TabsContent className="space-y-6" value="details">
          <Card>
            <CardHeader>
              <CardTitle>演讲信息</CardTitle>
              <CardDescription>查看演讲的详细信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    开始时间
                  </span>
                  <span className="font-medium text-sm">
                    {formatDate(lecture.starts_at)}
                  </span>
                </div>
                {lecture.ends_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      结束时间
                    </span>
                    <span className="font-medium text-sm">
                      {formatDate(lecture.ends_at)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    创建时间
                  </span>
                  <span className="font-medium text-sm">
                    {formatDate(lecture.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    最后更新
                  </span>
                  <span className="font-medium text-sm">
                    {formatDate(lecture.updated_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">演讲ID</span>
                  <span className="font-mono text-muted-foreground text-xs">
                    {lecture.id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">危险操作</CardTitle>
              <CardDescription>删除演讲将永久删除所有相关数据</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除演讲
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 演讲统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatsCard
          description="参与听众"
          icon={Users}
          title="参与人数"
          value={stats.totalParticipants}
        />

        <StatsCard
          description="已生成题目"
          icon={MessageSquare}
          title="测验题目"
          value={stats.totalQuizItems}
        />

        <StatsCard
          description="平均答对率"
          icon={ChartBar}
          title="答对率"
          value={`${avgCorrectRate}%`}
        />

        <StatsCard
          description="转录段数"
          icon={Mic}
          title="转录文本"
          value={stats.totalTranscripts}
        />

        <StatsCard
          description="上传材料"
          icon={FileText}
          title="材料数量"
          value={stats.totalMaterials}
        />

        <StatsCard
          description="材料+转录总字数"
          icon={Hash}
          title="上下文大小"
          value={
            stats.contextSize > 1000
              ? `${(stats.contextSize / 1000).toFixed(1)}k`
              : stats.contextSize
          }
        />

        <StatsCard
          description="平均答题时间"
          icon={Timer}
          title="响应速度"
          value={`${stats.avgResponseTime.toFixed(1)}s`}
        />

        <StatsCard
          description="演讲状态"
          icon={Zap}
          title="当前状态"
          value={lectureStatusConfig[lecture.status].label}
        />
      </div>

      {/* 编辑对话框 */}
      <EditLectureDialog
        lecture={lecture}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          setShowEditDialog(false);
          router.refresh();
        }}
        open={showEditDialog}
      />

      {/* 删除对话框 */}
      <DeleteLectureDialog
        lectureId={lecture.id}
        lectureTitle={lecture.title}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => {
          setShowDeleteDialog(false);
          router.replace('/lectures');
        }}
        open={showDeleteDialog}
      />
    </div>
  );
}
