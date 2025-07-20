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
import { Input } from '@repo/ui/components/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import {
  Calendar,
  ChartBar,
  Copy,
  Edit,
  Eye,
  EyeOff,
  MoreHorizontal,
  Presentation,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { StatsCard } from '@/components/stats-card';
import type { LectureWithDate, OrganizationDetailClientProps } from '@/types';
import DeleteOrganizationDialog from './delete-org-dialog';
import EditOrganizationDialog from './edit-org-dialog';

/**
 * 组织详情客户端组件 - 现代化极简设计
 */
export default function OrganizationDetailContent({
  organization,
  stats,
}: OrganizationDetailClientProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  /**
   * 复制密码到剪贴板
   */
  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(organization.password);
      toast.success('密码已复制');
    } catch (_error) {
      toast.error('复制失败');
    }
  };

  /**
   * 格式化日期
   */
  const formatDate = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
    });
  };

  /**
   * 格式化相对时间
   */
  const formatRelativeTime = (dateStr: string | Date) => {
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

  // 计算本月演讲数
  const monthlyLectures =
    organization.lectures?.filter((l: LectureWithDate) => {
      const lectureDate = new Date(l.created_at);
      const now = new Date();
      return (
        lectureDate.getMonth() === now.getMonth() &&
        lectureDate.getFullYear() === now.getFullYear()
      );
    }).length || 0;

  // 计算总参与人数
  const totalParticipants =
    organization.lectures?.reduce(
      (sum, lecture) => sum + (lecture.participantCount || 0),
      0
    ) || 0;

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <BreadcrumbNav
        items={[
          { label: '组织', href: '/organizations' },
          { label: organization.name },
        ]}
      />

      {/* 页面头部 - 标题和操作按钮在同一行 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl">{organization.name}</h1>
          <p className="text-muted-foreground">
            {organization.description || '暂无描述'}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              编辑信息
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyPassword}>
              <Copy className="mr-2 h-4 w-4" />
              复制密码
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
              删除组织
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 组织统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          description="演讲总数"
          icon={Sparkles}
          title="演讲总数"
          value={stats.totalLectures}
        />

        <StatsCard
          description="本月演讲"
          icon={Sparkles}
          title="本月演讲"
          value={monthlyLectures}
        />

        <StatsCard
          description="参与人数"
          icon={Users}
          title="参与人数"
          value={totalParticipants}
        />

        <StatsCard
          description="平均参与"
          icon={ChartBar}
          title="平均参与"
          value={
            stats.totalLectures > 0
              ? Math.round(totalParticipants / stats.totalLectures)
              : 0
          }
        />
      </div>

      {/* 标签页 */}
      <Tabs className="space-y-6" defaultValue="lectures">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lectures">演讲列表</TabsTrigger>
          <TabsTrigger value="details">详细信息</TabsTrigger>
        </TabsList>

        {/* 详细信息 */}
        <TabsContent className="space-y-6" value="details">
          <Card>
            <CardHeader>
              <CardTitle>访问密码</CardTitle>
              <CardDescription>演讲者需要此密码才能创建演讲</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    className="pr-20 font-mono"
                    readOnly
                    type={showPassword ? 'text' : 'password'}
                    value={organization.password}
                  />
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <Button
                      className="h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                      size="sm"
                      variant="ghost"
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      className="h-7 w-7 p-0"
                      onClick={copyPassword}
                      size="sm"
                      variant="ghost"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>组织信息</CardTitle>
              <CardDescription>查看组织的详细信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    创建时间
                  </span>
                  <span className="font-medium text-sm">
                    {formatDate(organization.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    最后更新
                  </span>
                  <span className="font-medium text-sm">
                    {formatDate(organization.updated_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">组织ID</span>
                  <span className="font-mono text-muted-foreground text-xs">
                    {organization.id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">危险操作</CardTitle>
              <CardDescription>删除组织将永久删除所有相关数据</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除组织
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 演讲列表 */}
        <TabsContent className="space-y-4" value="lectures">
          {organization.lectures && organization.lectures.length > 0 ? (
            <>
              <div className="grid gap-3">
                {organization.lectures.map((lecture: LectureWithDate) => (
                  <Card
                    className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
                    key={lecture.id}
                  >
                    <Link
                      className="absolute inset-0 z-10"
                      href={`/lectures/${lecture.id}`}
                    >
                      <span className="sr-only">查看{lecture.title}详情</span>
                    </Link>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <span className="truncate">{lecture.title}</span>
                            {lecture.status === 'active' && (
                              <Badge className="ml-2" variant="default">
                                进行中
                              </Badge>
                            )}
                          </CardTitle>
                          {lecture.description && (
                            <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                              {lecture.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Presentation className="h-4 w-4" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{lecture.participantCount || 0} 参与者</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatRelativeTime(lecture.created_at)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 加载更多按钮 */}
              {organization.lectures.length >= 10 && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline">查看全部演讲</Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Presentation className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">
                  还没有创建任何演讲
                </h3>
                <p className="text-center text-muted-foreground">
                  在这个组织下创建您的第一场演讲
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 编辑对话框 */}
      <EditOrganizationDialog
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          setShowEditDialog(false);
          router.refresh();
        }}
        open={showEditDialog}
        organization={organization}
      />

      {/* 删除对话框 */}
      <DeleteOrganizationDialog
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => {
          setShowDeleteDialog(false);
          // 使用 replace 而不是 push，避免保留历史记录
          router.replace('/organizations');
        }}
        open={showDeleteDialog}
        organizationId={organization.id}
        organizationName={organization.name}
      />
    </div>
  );
}
