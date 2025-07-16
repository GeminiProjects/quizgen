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
  Trash,
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
  // mock: 区分我创建的组织和我加入的组织
  const myCreatedOrganizations = [
    { id: 1, name: '默认组织' },
    { id: 2, name: 'AI 俱乐部' },
  ];
  const myJoinedOrganizations = [
    { id: 3, name: '前端联盟' },
  ];

  const [showCreateLectureModal, setShowCreateLectureModal] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDesc, setLectureDesc] = useState('');
  const [lectureType, setLectureType] = useState<'personal' | 'org'>(
    'personal'
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgPassword, setOrgPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
 
  // 新增：公开性与进入密码
  const [lectureVisibility, setLectureVisibility] = useState<'public' | 'private'>('public');
  const [lectureEntryPassword, setLectureEntryPassword] = useState('');

  // 新增：演讲时间
  const [lectureStartTime, setLectureStartTime] = useState('');

  // 新增：创建组织相关状态
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgCreatePassword, setOrgCreatePassword] = useState('');
  const [orgErrorMsg, setOrgErrorMsg] = useState('');

  // mock 密码校验
  const checkOrgPassword = (_orgId: string, password: string) => {
    // 假设所有组织密码都是 "123456"
    return password === '123456';
  };

  const validateLectureForm = () => {
    if (!lectureTitle.trim()) {
      setErrorMsg('演讲标题不能为空');
      return false;
    }
    if (!lectureStartTime) {
      setErrorMsg('请选择演讲时间');
      return false;
    }
    if (lectureVisibility === 'private' && !lectureEntryPassword) {
      setErrorMsg('不公开演讲需设置进入密码');
      return false;
    }
    if (lectureType === 'org') {
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

  // 新增：创建组织表单校验
  const validateOrgForm = () => {
    if (!orgName.trim()) {
      setOrgErrorMsg('组织名称不能为空');
      return false;
    }
    if (!orgCreatePassword) {
      setOrgErrorMsg('请输入组织密码');
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
      starts_at: new Date(lectureStartTime),
      participants_count: 0,
      owner: currentUser,
      organization:
        lectureType === 'org'
          ? myOrganizations.find((o) => o.id.toString() === selectedOrgId)
          : undefined,
      org_id: lectureType === 'org' ? selectedOrgId : null,
      visibility: lectureVisibility,
      entryPassword: lectureVisibility === 'private' ? lectureEntryPassword : undefined,
    };
  };

  const resetForm = () => {
    setShowCreateLectureModal(false);
    setLectureTitle('');
    setLectureDesc('');
    setLectureType('personal');
    setSelectedOrgId(null);
    setOrgPassword('');
    setLectureVisibility('public');
    setLectureEntryPassword('');
    setLectureStartTime('');
  };

  // 新增：创建组织处理
  const handleCreateOrg = () => {
    setOrgErrorMsg('');
    if (!validateOrgForm()) {
      return;
    }
    const newOrg = {
      id: Date.now().toString(),
      name: orgName,
      description: orgDesc,
      password: orgCreatePassword,
    };
    alert(`组织已创建: ${JSON.stringify(newOrg, null, 2)}`);
    resetOrgForm();
  };

  // 新增：重置组织表单
  const resetOrgForm = () => {
    setShowCreateOrgModal(false);
    setOrgName('');
    setOrgDesc('');
    setOrgCreatePassword('');
    setOrgErrorMsg('');
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
    alert(`演讲已创建: ${JSON.stringify(newLecture, null, 2)}`);
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

  // 删除确认弹框相关状态
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'lecture' | 'createdOrg' | 'joinedOrg'; id: string | number } | null>(null);

  // 删除弹框提示语
  const getDeleteConfirmText = () => {
    if (!deleteTarget) return '';
    if (deleteTarget.type === 'createdOrg') return '确认要解散该组织吗？';
    if (deleteTarget.type === 'joinedOrg') return '确认要脱离该组织吗？';
    if (deleteTarget.type === 'lecture') return '确认要删除该演讲吗？';
    return '确认要删除吗？';
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
                {/* 删除“创建演讲”按钮，这里只保留登出按钮 */}
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
                  <div className="text-muted-foreground text-sm">我的演讲</div>
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
                    参与的演讲
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
          {/* 我的演讲 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                我的演讲
                {/* 新增：标题右侧添加“创建演讲”按钮 */}
                <Button
                  className="ml-2 flex items-center gap-2"
                  onClick={() => setShowCreateLectureModal(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  创建演讲
                </Button>
              </CardTitle>
            </CardHeader>
            <div className="h-96 overflow-y-auto">
              <CardContent>
                <div className="space-y-4">
                  {myLectures.map((lecture) => (
                    <div
                      className="rounded-lg border p-4 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
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
                        <div className="flex gap-2 items-center">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/lecture/${lecture.id}/speaker`}>
                              演讲者视图
                            </Link>
                          </Button>
                          {lecture.status === 'active' && (
                            <Button asChild size="sm">
                              <Link href={`/lecture/${lecture.id}`}>
                                进入演讲
                              </Link>
                            </Button>
                          )}
                          {/* 删除按钮，仅展示，无功能 */}
                          <Button
                            size="sm"
                            variant="outline"
                            title="删除"
                            aria-label="删除"
                            type="button"
                            onClick={() => {
                              setDeleteTarget({ type: 'lecture', id: lecture.id });
                              setShowDeleteConfirmModal(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {myLectures.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p>还没有创建任何演讲</p>
                      <Button className="mt-4" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        创建第一个演讲
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>

          {/* 预约的演讲 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                预约的演讲
              </CardTitle>
            </CardHeader>
            <div className="max-h-96 overflow-y-auto lg:h-96">
              <CardContent>
                <div className="space-y-4">
                  {participatedLectures.map((lecture) => (
                    <div
                      className="rounded-lg border p-3 transition-colors hover:bg-accent/50 sm:p-4 dark:hover:bg-accent/30"
                      key={lecture.id}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {getStatusIcon(lecture.status)}
                            <h3 className="flex-1 font-medium text-base sm:text-lg">
                              {lecture.title}
                            </h3>
                            {getStatusBadge(lecture.status)}
                          </div>
                          <div className="mb-3 flex items-center gap-2">
                            <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                              <AvatarImage
                                alt={lecture.owner.display_name}
                                src={lecture.owner.avatar_url}
                              />
                              <AvatarFallback>
                                {lecture.owner.display_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground text-xs sm:text-sm">
                              {lecture.owner.display_name}
                            </span>
                          </div>
                          {/* 所属组织 */}
                          <div className="mb-2 flex items-center gap-1">
                            <Users
                              aria-label="组织"
                              className="h-3 w-3 sm:h-4 sm:w-4"
                            />
                            <span className="text-muted-foreground text-xs">
                              {lecture.organization?.name || '默认组织'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs sm:gap-4 sm:text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">
                                {formatDate(lecture.starts_at)}
                              </span>
                              <span className="sm:hidden">
                                {lecture.starts_at.toLocaleDateString('zh-CN', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                              {lecture.participants_count}人
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {lecture.status === 'active' && (
                            <Button
                              asChild
                              className="flex-1 sm:flex-initial"
                              size="sm"
                            >
                              <Link href={`/lecture/${lecture.id}`}>加入</Link>
                            </Button>
                          )}
                          {lecture.status === 'pending' && (
                            <Button
                              className="flex-1 sm:flex-initial"
                              disabled
                              size="sm"
                              variant="outline"
                            >
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
                      <p>还没有参与任何演讲</p>
                      <p className="mt-2 text-sm">使用邀请链接加入演讲</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* 我创建的组织 & 我加入的组织 - 并列布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 lg:mt-8">
          {/* 我创建的组织 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                我创建的组织
                <Button
                  className="ml-2 flex items-center gap-2"
                  size="sm"
                  onClick={() => setShowCreateOrgModal(true)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  创建组织
                </Button>
              </CardTitle>
            </CardHeader>
            <div className="max-h-96 overflow-y-auto lg:h-96">
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {myCreatedOrganizations.length > 0 ? (
                    myCreatedOrganizations.map((org) => (
                      <div
                        className="flex items-center gap-3 rounded-lg border p-3 sm:p-4"
                        key={org.id}
                      >
                        <Users
                          aria-label="组织"
                          className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6"
                        />
                        <span className="font-medium text-sm sm:text-base">
                          {org.name}
                        </span>
                        {/* 删除按钮，仅展示，无功能 */}
                        <Button
                          size="sm"
                          variant="outline"
                          title="删除"
                          aria-label="删除"
                          type="button"
                          onClick={() => {
                            setDeleteTarget({ type: 'createdOrg', id: org.id });
                            setShowDeleteConfirmModal(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm sm:text-base">还没有创建任何组织</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
          {/* 我加入的组织 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                我加入的组织
              </CardTitle>
            </CardHeader>
            <div className="max-h-96 overflow-y-auto lg:h-96">
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {myJoinedOrganizations.length > 0 ? (
                    myJoinedOrganizations.map((org) => (
                      <div
                        className="flex items-center gap-3 rounded-lg border p-3 sm:p-4"
                        key={org.id}
                      >
                        <Users
                          aria-label="组织"
                          className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6"
                        />
                        <span className="font-medium text-sm sm:text-base">
                          {org.name}
                        </span>
                        {/* 删除按钮，仅展示，无功能 */}
                        <Button
                          size="sm"
                          variant="outline"
                          title="删除"
                          aria-label="删除"
                          type="button"
                          onClick={() => {
                            setDeleteTarget({ type: 'joinedOrg', id: org.id });
                            setShowDeleteConfirmModal(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm sm:text-base">还没有加入任何组织</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>

      {showCreateLectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-lg bg-card p-4 shadow-lg sm:mx-0 sm:p-6">
            <button
              aria-label="关闭"
              className="absolute top-2 right-2 rounded-sm p-1 text-muted-foreground transition-opacity hover:text-foreground hover:opacity-100"
              onClick={() => setShowCreateLectureModal(false)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <h2 className="mb-4 font-bold text-lg sm:text-xl">创建演讲</h2>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="lecture-title"
              >
                演讲标题
              </label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="lecture-title"
                onChange={(e) => setLectureTitle(e.target.value)}
                placeholder="请输入演讲标题"
                value={lectureTitle}
              />
            </div>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="lecture-description"
              >
                演讲描述
              </label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="lecture-description"
                onChange={(e) => setLectureDesc(e.target.value)}
                placeholder="请输入演讲描述"
                rows={3}
                value={lectureDesc}
              />
            </div>
            <div className="mb-3">
              <fieldset>
                <legend className="mb-1 block font-medium text-sm">演讲类型</legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1">
                    <input
                      checked={lectureType === 'personal'}
                      name="lectureType"
                      onChange={() => setLectureType('personal')}
                      type="radio"
                      value="personal"
                    />
                    个人
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      checked={lectureType === 'org'}
                      name="lectureType"
                      onChange={() => setLectureType('org')}
                      type="radio"
                      value="org"
                    />
                    组织
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
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
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
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                    id="org-password"
                    onChange={(e) => setOrgPassword(e.target.value)}
                    placeholder="请输入组织密码"
                    type="password"
                    value={orgPassword}
                  />
                </div>
              </>
            )}
            <div className="mb-3">
              <fieldset>
                <legend className="mb-1 block font-medium text-sm">公开性</legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1">
                    <input
                      checked={lectureVisibility === 'public'}
                      name="lectureVisibility"
                      onChange={() => setLectureVisibility('public')}
                      type="radio"
                      value="public"
                    />
                    公开
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      checked={lectureVisibility === 'private'}
                      name="lectureVisibility"
                      onChange={() => setLectureVisibility('private')}
                      type="radio"
                      value="private"
                    />
                    不公开
                  </label>
                </div>
              </fieldset>
            </div>
            {lectureVisibility === 'private' && (
              <div className="mb-3">
                <label
                  className="mb-1 block font-medium text-sm"
                  htmlFor="lecture-entry-password"
                >
                  进入密码
                </label>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  id="lecture-entry-password"
                  onChange={(e) => setLectureEntryPassword(e.target.value)}
                  placeholder="请输入进入密码"
                  type="password"
                  value={lectureEntryPassword}
                />
              </div>
            )}
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="lecture-start-time"
              >
                演讲时间
              </label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="lecture-start-time"
                type="datetime-local"
                value={lectureStartTime}
                onChange={(e) => setLectureStartTime(e.target.value)}
                required
              />
            </div>
            {errorMsg && (
              <div className="mb-2 text-destructive text-sm">{errorMsg}</div>
            )}
            <Button className="mt-2 w-full" onClick={handleCreateLecture}>
              创建
            </Button>
          </div>
        </div>
      )}
      {/* 新增：创建组织模态框 */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-lg bg-card p-4 shadow-lg sm:mx-0 sm:p-6">
            <button
              aria-label="关闭"
              className="absolute top-2 right-2 rounded-sm p-1 text-muted-foreground transition-opacity hover:text-foreground hover:opacity-100"
              onClick={resetOrgForm}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <h2 className="mb-4 font-bold text-lg sm:text-xl">创建组织</h2>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="org-name"
              >
                组织名称
              </label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="org-name"
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="请输入组织名称"
                value={orgName}
              />
            </div>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="org-desc"
              >
                组织简述
              </label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="org-desc"
                onChange={(e) => setOrgDesc(e.target.value)}
                placeholder="请输入组织简述"
                rows={3}
                value={orgDesc}
              />
            </div>
            <div className="mb-3">
              <label
                className="mb-1 block font-medium text-sm"
                htmlFor="org-create-password"
              >
                组织密码
              </label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                id="org-create-password"
                onChange={(e) => setOrgCreatePassword(e.target.value)}
                placeholder="请输入组织密码"
                type="password"
                value={orgCreatePassword}
              />
            </div>
            {orgErrorMsg && (
              <div className="mb-2 text-destructive text-sm">{orgErrorMsg}</div>
            )}
            <Button className="mt-2 w-full" onClick={handleCreateOrg}>
              创建
            </Button>
          </div>
        </div>
      )}
      {/* 删除确认弹框 */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-lg bg-card p-4 sm:p-6 shadow-lg sm:mx-0">
            <button
              aria-label="关闭"
              className="absolute top-2 right-2 rounded-sm p-1 text-muted-foreground transition-opacity hover:text-foreground hover:opacity-100"
              onClick={() => setShowDeleteConfirmModal(false)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <h2 className="mb-4 font-bold text-lg sm:text-xl text-center">{getDeleteConfirmText()}</h2>
            <div className="flex justify-center gap-4 mt-2">
              <Button
                variant="destructive"
                className="w-24"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                确定
              </Button>
              <Button
                variant="outline"
                className="w-24"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
