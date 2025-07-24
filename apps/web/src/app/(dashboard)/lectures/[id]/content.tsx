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
  MoreHorizontal,
  Timer,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { endLecture, pauseLecture, startLecture } from '@/app/actions/lectures';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { CommentSection } from '@/components/comment-section';
import { StatsCard } from '@/components/stats-card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { type LectureDetailClientProps, lectureStatusConfig } from '@/types';
import DeleteLectureDialog from './delete-lecture-dialog';
import EditLectureDialog from './edit-lecture-dialog';
import LectureControlSection from './lecture-control-section';
import MaterialsTab from './materials-tab';
import QuizManagementTab from './quiz-management-tab';

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

  // 使用 localStorage 持久化当前选中的标签
  const [activeTab, setActiveTab] = useLocalStorage(
    `lecture-${lecture.id}-active-tab`,
    'materials'
  );

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
   * 处理演讲状态变更
   */
  const handleStatusChange = async (action: 'start' | 'pause' | 'end') => {
    setLoading(true);
    try {
      if (action === 'start') {
        await startLecture(lecture.id);
        toast.success('演讲已开始');
      } else if (action === 'pause') {
        await pauseLecture(lecture.id);
        toast.success('演讲已暂停');
      } else {
        await endLecture(lecture.id);
        toast.success('演讲已结束');
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbItems = [
    { href: '/lectures', label: '演讲管理' },
    { label: lecture.title },
  ];

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <BreadcrumbNav items={breadcrumbItems} />

      {/* 页面头部 */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-3xl">{lecture.title}</h1>
            <Badge
              className={lectureStatusConfig[lecture.status].className}
              variant={lectureStatusConfig[lecture.status].variant}
            >
              {lectureStatusConfig[lecture.status].label}
            </Badge>
          </div>
          {lecture.description && (
            <p className="text-lg text-muted-foreground">
              {lecture.description}
            </p>
          )}
          <p className="text-muted-foreground text-sm">
            开始时间：{formatDate(lecture.starts_at)}
          </p>
        </div>

        {/* 操作菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              编辑信息
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除演讲
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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

        {/* <StatsCard
          description="转录段数"
          icon={Mic}
          title="转录文本"
          value={stats.totalTranscripts}
        /> */}

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

      {/* 演讲控制和转录面板 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <LectureControlSection
          joinCode={lecture.join_code}
          lectureId={lecture.id}
          loading={loading}
          onStatusChange={handleStatusChange}
          status={lecture.status}
        />
      </div>

      {/* 功能标签页 */}
      <Card>
        <CardHeader>
          <CardTitle>演讲详情</CardTitle>
          <CardDescription>查看和管理演讲的各项数据</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="materials">
                <FileText className="mr-2 h-4 w-4" />
                材料管理
              </TabsTrigger>
              <TabsTrigger value="quiz">
                <MessageSquare className="mr-2 h-4 w-4" />
                题库管理
              </TabsTrigger>
              <TabsTrigger value="comments">
                <MessageSquare className="mr-2 h-4 w-4" />
                讨论区
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <ChartBar className="mr-2 h-4 w-4" />
                数据分析
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materials">
              <MaterialsTab lectureId={lecture.id} />
            </TabsContent>

            <TabsContent value="quiz">
              <QuizManagementTab
                lectureId={lecture.id}
                lectureStatus={lecture.status}
              />
            </TabsContent>

            <TabsContent value="comments">
              <CommentSection isSpeaker={true} lectureId={lecture.id} />
            </TabsContent>

            <TabsContent value="analytics">
              <div className="py-8 text-center text-muted-foreground">
                数据分析功能开发中...
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 对话框 */}
      <EditLectureDialog
        lecture={lecture}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          setShowEditDialog(false);
          router.refresh();
        }}
        open={showEditDialog}
      />

      <DeleteLectureDialog
        lectureId={lecture.id}
        lectureTitle={lecture.title}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => router.push('/lectures')}
        open={showDeleteDialog}
      />
    </div>
  );
}
