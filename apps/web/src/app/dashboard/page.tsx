'use client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  LogOut,
  Play,
  Plus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { signOut } from '@/lib/auth-client';
import {
  getCurrentUser,
  getUserLectures,
  getUserParticipatedLectures,
} from '@/lib/mock-data';

export default function Dashboard() {
  const currentUser = getCurrentUser();
  const myLectures = getUserLectures(currentUser.id).map((l) => ({
    ...l,
    organization: { name: '默认组织' },
  }));
  const participatedLectures = getUserParticipatedLectures(currentUser.id).map(
    (l) => ({ ...l, organization: { name: '默认组织' } })
  );
  const myOrganizations = [{ id: 1, name: '默认组织' }]; // mock 组织数据

  const [showCreateLectureModal, setShowCreateLectureModal] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDesc, setLectureDesc] = useState('');
  const [lectureType, setLectureType] = useState<'personal' | 'org'>(
    'personal'
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgPassword, setOrgPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // mock 密码校验
  const checkOrgPassword = (_orgId: string, password: string) => {
    // 假设所有组织密码都是 "123456"
    return password === '123456';
  };

  const validateLectureForm = () => {
    if (!lectureTitle.trim()) {
      setErrorMsg('讲座标题不能为空');
      return false;
    }
    return true;
  };

  const validateOrgLecture = () => {
    if (!selectedOrgId) {
      setErrorMsg('请选择组织');
      return false;
    }
    if (!orgPassword) {
      setErrorMsg('请输入组织密码');
      return false;
    }
    if (!checkOrgPassword(selectedOrgId, orgPassword)) {
      setErrorMsg('组织密码错误');
      return false;
    }
    return true;
  };

  const createLectureObject = () => {
    return {
      id: Date.now().toString(),
      title: lectureTitle,
      description: lectureDesc,
      status: 'pending',
      starts_at: new Date(),
      participants_count: 0,
      owner: currentUser,
      organization:
        lectureType === 'org'
          ? myOrganizations.find((o) => o.id.toString() === selectedOrgId)
          : undefined,
      org_id: lectureType === 'org' ? selectedOrgId : null,
    };
  };

  const resetForm = () => {
    setShowCreateLectureModal(false);
    setLectureTitle('');
    setLectureDesc('');
    setLectureType('personal');
    setSelectedOrgId(null);
    setOrgPassword('');
  };

  const handleCreateLecture = () => {
    setErrorMsg('');

    if (!validateLectureForm()) {
      return;
    }

    if (lectureType === 'org' && !validateOrgLecture()) {
      return;
    }

    const newLecture = createLectureObject();

    // 这里只是演示，实际应 setState 或调用后端
    alert(`讲座已创建: ${JSON.stringify(newLecture, null, 2)}`);
    resetForm();
  };

  // 处理登出
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            进行中
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
            待开始
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-muted text-muted-foreground hover:bg-muted/80">
            已结束
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl text-foreground">
                QuizGen Dashboard
              </h1>
              <p className="mt-1 text-muted-foreground">智能演讲互动平台</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    alt={currentUser.display_name}
                    src={currentUser.avatar_url}
                  />
                  <AvatarFallback>
                    {currentUser.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{currentUser.display_name}</div>
                  <div className="text-muted-foreground text-sm">
                    {currentUser.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="flex items-center gap-2"
                  onClick={() => setShowCreateLectureModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  创建讲座
                </Button>
                <Button
                  onClick={handleSignOut}
                  size="icon"
                  title="登出"
                  variant="outline"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 快速统计 */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-2xl">{myLectures.length}</div>
                  <div className="text-muted-foreground text-sm">我的讲座</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Play className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <div className="font-bold text-2xl">
                    {myLectures.filter((l) => l.status === 'active').length}
                  </div>
                  <div className="text-muted-foreground text-sm">进行中</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <div className="font-bold text-2xl">
                    {participatedLectures.length}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    参与的讲座
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 新增组织卡片 */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-yellow-500/10 p-3">
                  <Users
                    aria-label="组织"
                    className="h-6 w-6 text-yellow-500"
                  />
                </div>
                <div>
                  <div className="font-bold text-2xl">
                    {myOrganizations.length}
                  </div>
                  <div className="text-muted-foreground text-sm">组织</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 我的讲座 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                我的讲座
              </CardTitle>
            </CardHeader>
            <div className="h-96 overflow-y-auto">
              <CardContent>
                <div className="space-y-4">
                  {myLectures.map((lecture) => (
                    <div
                      className="rounded-lg border p-4 transition-colors hover:bg-accent"
                      key={lecture.id}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            {getStatusIcon(lecture.status)}
                            <h3 className="font-medium text-lg">
                              {lecture.title}
                            </h3>
                            {getStatusBadge(lecture.status)}
                          </div>
                          <p className="mb-3 text-muted-foreground text-sm">
                            {lecture.description}
                          </p>
                          {/* 所属组织 */}
                          <div className="mb-2 flex items-center gap-1">
                            <Users aria-label="组织" className="h-4 w-4" />
                            <span className="text-muted-foreground text-xs">
                              {lecture.organization?.name || '默认组织'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(lecture.starts_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {lecture.participants_count}人
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/lecture/${lecture.id}/speaker`}>
                              演讲者视图
                            </Link>
                          </Button>
                          {lecture.status === 'active' && (
                            <Button asChild size="sm">
                              <Link href={`/lecture/${lecture.id}`}>
                                进入讲座
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {myLectures.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p>还没有创建任何讲座</p>
                      <Button className="mt-4" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        创建第一个讲座
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>

          {/* 参与的讲座 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                参与的讲座
              </CardTitle>
            </CardHeader>
            <div className="h-96 overflow-y-auto">
              <CardContent>
                <div className="space-y-4">
                  {participatedLectures.map((lecture) => (
                    <div
                      className="rounded-lg border p-4 transition-colors hover:bg-accent"
                      key={lecture.id}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            {getStatusIcon(lecture.status)}
                            <h3 className="font-medium text-lg">
                              {lecture.title}
                            </h3>
                            {getStatusBadge(lecture.status)}
                          </div>
                          <div className="mb-3 flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                alt={lecture.owner.display_name}
                                src={lecture.owner.avatar_url}
                              />
                              <AvatarFallback>
                                {lecture.owner.display_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground text-sm">
                              {lecture.owner.display_name}
                            </span>
                          </div>
                          {/* 所属组织 */}
                          <div className="mb-2 flex items-center gap-1">
                            <Users aria-label="组织" className="h-4 w-4" />
                            <span className="text-muted-foreground text-xs">
                              {lecture.organization?.name || '默认组织'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(lecture.starts_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {lecture.participants_count}人
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {lecture.status === 'active' && (
                            <Button asChild size="sm">
                              <Link href={`/lecture/${lecture.id}`}>
                                加入讲座
                              </Link>
                            </Button>
                          )}
                          {lecture.status === 'pending' && (
                            <Button disabled size="sm" variant="outline">
                              等待开始
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {participatedLectures.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p>还没有参与任何讲座</p>
                      <p className="mt-2 text-sm">使用邀请链接加入讲座</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* 我的组织 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              我的组织
            </CardTitle>
          </CardHeader>
          <div className="h-96 overflow-y-auto">
            <CardContent>
              <div className="space-y-4">
                {myOrganizations.length > 0 ? (
                  myOrganizations.map((org) => (
                    <div
                      className="flex items-center gap-3 rounded-lg border p-4"
                      key={org.id}
                    >
                      <Users
                        aria-label="组织"
                        className="h-6 w-6 text-yellow-500"
                      />
                      <span className="font-medium">{org.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p>还没有加入任何组织</p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {showCreateLectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <button
              aria-label="关闭"
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCreateLectureModal(false)}
              type="button"
            >
              ×
            </button>
            <h2 className="mb-4 font-bold text-xl">创建讲座</h2>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="lecture-title"
              >
                讲座标题
              </label>
              <input
                className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="lecture-title"
                onChange={(e) => setLectureTitle(e.target.value)}
                placeholder="请输入讲座标题"
                value={lectureTitle}
              />
            </div>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="lecture-description"
              >
                讲座描述
              </label>
              <textarea
                className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="lecture-description"
                onChange={(e) => setLectureDesc(e.target.value)}
                placeholder="请输入讲座描述"
                value={lectureDesc}
              />
            </div>
            <div className="mb-3">
              <fieldset>
                <legend className="mb-1 block font-medium text-sm">
                  讲座类型
                </legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1">
                    <input
                      checked={lectureType === 'personal'}
                      name="lectureType"
                      onChange={() => setLectureType('personal')}
                      type="radio"
                      value="personal"
                    />
                    个人讲座
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      checked={lectureType === 'org'}
                      name="lectureType"
                      onChange={() => setLectureType('org')}
                      type="radio"
                      value="org"
                    />
                    加入组织
                  </label>
                </div>
              </fieldset>
            </div>
            {lectureType === 'org' && (
              <>
                <div className="mb-3">
                  <label
                    className="mb-1 block font-medium text-sm"
                    htmlFor="org-select"
                  >
                    选择组织
                  </label>
                  <select
                    className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                    id="org-select"
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    value={selectedOrgId || ''}
                  >
                    <option value="">请选择组织</option>
                    {myOrganizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label
                    className="mb-1 block font-medium text-sm"
                    htmlFor="org-password"
                  >
                    组织密码
                  </label>
                  <input
                    className="w-full rounded border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                    id="org-password"
                    onChange={(e) => setOrgPassword(e.target.value)}
                    placeholder="请输入组织密码"
                    type="password"
                    value={orgPassword}
                  />
                </div>
              </>
            )}
            {errorMsg && (
              <div className="mb-2 text-destructive text-sm">{errorMsg}</div>
            )}
            <Button className="mt-2 w-full" onClick={handleCreateLecture}>
              创建
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
