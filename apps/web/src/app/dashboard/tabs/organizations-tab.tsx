'use client';

import type { SessionResponse } from '@repo/auth';
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
import { Plus, Presentation, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import OrganizationStatsCard from '../components/organization-stats-card';
import CreateOrganizationDialog from '../dialogs/create-organization-dialog';

interface Organization {
  id: string;
  name: string;
  description: string | null;
  password: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  _count?: {
    lectures: number;
  };
}

interface OrganizationsTabProps {
  session: SessionResponse;
}

/**
 * 组织管理标签页
 * 显示用户创建的组织列表，支持创建、管理组织
 */
export default function OrganizationsTab({ session }: OrganizationsTabProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // 获取组织列表
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const result = await response.json();

      if (result.success) {
        setOrganizations(result.data.data);
      } else {
        toast.error(result.message || '获取组织列表失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // 格式化时间
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  // 创建组织成功后的回调
  const handleOrganizationCreated = (newOrganization: Organization) => {
    setOrganizations((prev) => [newOrganization, ...prev]);
    setShowCreateDialog(false);
    toast.success('组织创建成功');
  };

  // 复制组织密码
  const copyPassword = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success('密码已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败，请手动复制');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">我的组织</h2>
          <p className="text-muted-foreground">
            管理您创建的组织，查看组织内演讲活动
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          创建组织
        </Button>
      </div>

      {/* 组织统计 */}
      <OrganizationStatsCard organizations={organizations} />

      {/* 组织列表 */}
      <div className="grid gap-4">
        {organizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">还没有创建任何组织</h3>
              <p className="mb-4 text-muted-foreground">
                创建您的第一个组织，开始管理系列演讲活动！
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                创建组织
              </Button>
            </CardContent>
          </Card>
        ) : (
          organizations.map((organization) => (
            <Card
              className="transition-shadow hover:shadow-md"
              key={organization.id}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-1 text-xl">
                      {organization.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {organization.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {organization._count?.lectures || 0} 个演讲
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">组织密码</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">
                        {organization.password}
                      </p>
                      <Button
                        onClick={() => copyPassword(organization.password)}
                        size="sm"
                        variant="ghost"
                      >
                        复制
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">创建时间</p>
                    <p className="text-sm">
                      {formatDateTime(organization.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Presentation className="mr-1 h-4 w-4" />
                    查看演讲
                  </Button>

                  <Button size="sm" variant="outline">
                    <Users className="mr-1 h-4 w-4" />
                    管理设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 创建组织对话框 */}
      <CreateOrganizationDialog
        onOpenChange={setShowCreateDialog}
        onSuccess={handleOrganizationCreated}
        open={showCreateDialog}
      />
    </div>
  );
}
