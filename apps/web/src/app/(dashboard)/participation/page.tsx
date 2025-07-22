import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  MessageSquare,
  Play,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { getParticipatedLectures } from '@/app/actions/participation';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { StatsCard } from '@/components/stats-card';
import { lectureStatusConfig } from '@/types';
import { ParticipationSearch } from './participation-search';

export default async function ParticipationPage() {
  const { data: participations } = await getParticipatedLectures();

  // 格式化相对时间
  const formatRelativeTime = (dateStr: string) => {
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
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
    });
  };

  // 计算统计数据
  const stats = {
    totalParticipations: participations.length,
    inProgress: participations.filter((p) => p.status === 'in_progress').length,
    completed: participations.filter((p) => p.status === 'ended').length,
    totalQuizzes: participations.reduce(
      (sum, p) => sum + (p._count?.quiz_items || 0),
      0
    ),
  };

  const breadcrumbItems = [{ label: '参与演讲' }];

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <BreadcrumbNav items={breadcrumbItems} />

      {/* 页面头部和搜索 */}
      <ParticipationSearch />

      {/* 统计卡片 */}
      {participations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <StatsCard
              description="累计参与"
              icon={Users}
              title="参与演讲"
              value={stats.totalParticipations}
            />
          </div>
          <div className="lg:col-span-2">
            <StatsCard
              description="正在进行"
              icon={Play}
              title="进行中"
              value={stats.inProgress}
            />
          </div>
          <div className="lg:col-span-2">
            <StatsCard
              description="已完成"
              icon={CheckCircle}
              title="已完成"
              value={stats.completed}
            />
          </div>
        </div>
      )}

      {/* 演讲列表 */}
      {participations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">还没有参与任何演讲</h3>
            <p className="mb-4 text-center text-muted-foreground">
              输入演讲码加入您的第一场演讲！
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {participations.map((p) => (
            <Card
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
              key={p.id}
            >
              <Link
                className="absolute inset-0 z-10"
                href={`/participation/${p.id}`}
              >
                <span className="sr-only">查看{p.title}详情</span>
              </Link>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="truncate">{p.title}</span>
                      <Badge
                        className={lectureStatusConfig[p.status]?.className}
                        variant={lectureStatusConfig[p.status]?.variant}
                      >
                        {lectureStatusConfig[p.status]?.label}
                      </Badge>
                      <ArrowRight className="-translate-x-1 h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                      {p.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                    {p.status === 'in_progress' ? (
                      <Play className="h-4 w-4" />
                    ) : p.status === 'ended' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3 text-muted-foreground text-sm">
                  <span>演讲者：{p.owner_name || '未知'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{p._count?.quiz_items || 0} 道题</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatRelativeTime(p.joined_at || '')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
