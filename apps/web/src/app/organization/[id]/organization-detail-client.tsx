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
  Building2,
  Calendar,
  ChartBar,
  Copy,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Info,
  MoreVertical,
  Presentation,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import DeleteOrganizationDialog from './delete-organization-dialog';
import EditOrganizationDialog from './edit-organization-dialog';

interface LectureWithDate {
  id: string;
  title: string;
  created_at: string | Date;
  description?: string | null;
  status?: string;
  participantCount?: number;
}

interface OrganizationWithLectures {
  id: string;
  name: string;
  description: string | null;
  password: string;
  lectures?: LectureWithDate[];
  created_at: string | Date;
  updated_at: string | Date;
}

interface OrganizationDetailClientProps {
  organization: OrganizationWithLectures;
  stats: {
    totalLectures: number;
  };
}

/**
 * 组织详情客户端组件
 */
export default function OrganizationDetailClient({
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
      toast.success('密码已复制到剪贴板');
    } catch (_error) {
      toast.error('复制失败，请手动复制');
    }
  };

  /**
   * 格式化日期时间
   */
  const formatDateTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 面包屑导航 */}
        <div className="mb-6">
          <BreadcrumbNav
            items={[
              { label: '控制台', href: '/dashboard' },
              { label: '组织管理', href: '/dashboard?tab=organizations' },
              { label: organization.name },
            ]}
          />
        </div>

        {/* 页面头部 */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-2xl md:text-3xl">
                {organization.name}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {organization.description || '暂无描述'}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-9 w-9" size="icon" variant="outline">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">更多操作</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                编辑组织信息
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyPassword}>
                <Copy className="mr-2 h-4 w-4" />
                复制组织密码
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除组织
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 统计卡片 - 优化设计，提高信息密度 */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="group relative overflow-hidden transition-all hover:border-primary/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">总演讲数</p>
                  <p className="font-semibold text-xl">{stats.totalLectures}</p>
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <TrendingUp className="h-3 w-3" />
                    <span>累计创建</span>
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Presentation className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden transition-all hover:border-success/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">本月演讲</p>
                  <p className="font-semibold text-xl">
                    {organization.lectures?.filter((l: LectureWithDate) => {
                      const lectureDate = new Date(l.created_at);
                      const now = new Date();
                      return (
                        lectureDate.getMonth() === now.getMonth() &&
                        lectureDate.getFullYear() === now.getFullYear()
                      );
                    }).length || 0}
                  </p>
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>本月新增</span>
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10 text-success">
                  <ChartBar className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden transition-all hover:border-info/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">参与人数</p>
                  <p className="font-semibold text-xl">-</p>
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Users className="h-3 w-3" />
                    <span>总参与</span>
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-info/10 text-info">
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden transition-all hover:border-accent/30">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">创建时间</p>
                  <p className="font-semibold text-base">
                    {new Date(organization.created_at).toLocaleDateString(
                      'zh-CN',
                      {
                        month: 'numeric',
                        day: 'numeric',
                      }
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(organization.created_at).toLocaleDateString(
                        'zh-CN',
                        { year: 'numeric' }
                      )}
                    </span>
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent-foreground">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 标签页内容 - 优化样式 */}
        <Tabs className="space-y-6" defaultValue="info">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger className="gap-2" value="info">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">基本信息</span>
              <span className="sm:hidden">信息</span>
            </TabsTrigger>
            <TabsTrigger className="gap-2" value="lectures">
              <Presentation className="h-4 w-4" />
              <span className="hidden sm:inline">演讲列表</span>
              <span className="sm:hidden">演讲</span>
            </TabsTrigger>
            <TabsTrigger className="gap-2" value="settings">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">设置</span>
              <span className="sm:hidden">设置</span>
            </TabsTrigger>
          </TabsList>

          {/* 基本信息标签 */}
          <TabsContent className="space-y-4" value="info">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>组织信息</CardTitle>
                    <CardDescription>查看和管理组织的基本信息</CardDescription>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      组织名称
                    </div>
                    <p className="mt-1 text-lg">{organization.name}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      组织描述
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      {organization.description || '暂无描述'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-warning/20 bg-warning/5 p-3 md:p-4">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Shield className="h-4 w-4 text-warning" />
                    组织密码
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                    <div className="w-full flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm">
                      {showPassword ? organization.password : '••••••••'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="h-8 w-8 md:h-9 md:w-9"
                        onClick={() => setShowPassword(!showPassword)}
                        size="icon"
                        variant="ghost"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        className="h-8 w-8 md:h-9 md:w-9"
                        onClick={copyPassword}
                        size="icon"
                        variant="ghost"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    演讲者需要此密码才能在该组织下创建演讲
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3 md:p-4">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      创建时间
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs md:text-sm">
                      {formatDateTime(organization.created_at)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 md:p-4">
                    <div className="flex items-center gap-2 font-medium text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      更新时间
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs md:text-sm">
                      {formatDateTime(organization.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 演讲列表标签 */}
          <TabsContent className="space-y-4" value="lectures">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>演讲列表</CardTitle>
                    <CardDescription>查看该组织下的所有演讲</CardDescription>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Presentation className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {organization.lectures && organization.lectures.length > 0 ? (
                  <div className="space-y-3">
                    {organization.lectures.map((lecture: LectureWithDate) => (
                      <Link
                        className="block"
                        href={`/lecture/${lecture.id}`}
                        key={lecture.id}
                      >
                        <div className="group relative overflow-hidden rounded-lg border p-3 transition-all hover:border-primary/30 hover:bg-accent/5 hover:shadow-sm md:p-4">
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110 md:h-10 md:w-10">
                              <FileText className="h-4 w-4 md:h-5 md:w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <h4 className="line-clamp-1 font-medium text-base md:text-lg">
                                    {lecture.title}
                                  </h4>
                                  {lecture.description && (
                                    <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                                      {lecture.description}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  className="flex-shrink-0 self-start"
                                  variant={
                                    lecture.status === 'active'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {lecture.status === 'active'
                                    ? '进行中'
                                    : '已结束'}
                                </Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-xs md:mt-3 md:gap-4 md:text-sm">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                  {new Date(
                                    lecture.created_at
                                  ).toLocaleDateString('zh-CN')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                  {lecture.participantCount || 0} 参与者
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    {organization.lectures.length >= 10 && (
                      <div className="pt-4 text-center">
                        <Button variant="outline">查看全部演讲</Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Presentation className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 font-medium text-lg">还没有演讲</h3>
                    <p className="mt-1 text-center text-muted-foreground text-sm">
                      该组织下还没有任何演讲
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 设置标签 */}
          <TabsContent className="space-y-4" value="settings">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>组织设置</CardTitle>
                    <CardDescription>管理组织的高级设置</CardDescription>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                    <Settings className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-6 transition-all hover:shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Edit className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-medium">编辑组织信息</h3>
                      <p className="text-muted-foreground text-sm">
                        修改组织名称、描述和访问密码
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowEditDialog(true)}
                      variant="outline"
                    >
                      编辑
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-medium text-destructive">删除组织</h3>
                      <p className="text-muted-foreground text-sm">
                        删除后无法恢复，相关演讲将保留但不再属于任何组织
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="destructive"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            router.replace('/dashboard?tab=organizations');
          }}
          open={showDeleteDialog}
          organizationId={organization.id}
          organizationName={organization.name}
        />
      </div>
    </div>
  );
}
