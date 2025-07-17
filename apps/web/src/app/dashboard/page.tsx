'use client';
import { Badge } from '@repo/ui/components/badge';
import { AlertCircle, CheckCircle, Clock, Play } from 'lucide-react';
import { useState } from 'react';
import { signOut } from '@/lib/auth-client';
import {
  getCurrentUser,
  getUserLectures,
  getUserParticipatedLectures,
} from '@/lib/mock-data';
import CreateLectureModal from './create-lecture-modal';
import CreateOrgModal from './create-org-modal';
import CreatedOrganizationsList from './created-organizations-list';
import DeleteConfirmModal from './delete-confirm-modal';
import Header from './header';
import JoinedOrganizationsList from './joined-organizations-list';
import MyLecturesList from './my-lectures-list';
import ParticipatedLecturesList from './participated-lectures-list';
import StatsCards from './stats-cards';

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
  const myJoinedOrganizations = [{ id: 3, name: '前端联盟' }];

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
  const [lectureVisibility, setLectureVisibility] = useState<
    'public' | 'private'
  >('public');
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

  // 校验演讲标题
  const validateLectureTitle = () => {
    if (!lectureTitle.trim()) {
      setErrorMsg('演讲标题不能为空');
      return false;
    }
    return true;
  };
  // 校验演讲时间
  const validateLectureStartTime = () => {
    if (!lectureStartTime) {
      setErrorMsg('请选择演讲时间');
      return false;
    }
    return true;
  };
  // 校验公开性
  const validateLectureVisibility = () => {
    if (lectureVisibility === 'private' && !lectureEntryPassword) {
      setErrorMsg('不公开演讲需设置进入密码');
      return false;
    }
    return true;
  };
  // 校验组织相关
  const validateLectureOrg = () => {
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
  // 主校验函数
  const validateLectureForm = () => {
    if (!validateLectureTitle()) {
      return false;
    }
    if (!validateLectureStartTime()) {
      return false;
    }
    if (!validateLectureVisibility()) {
      return false;
    }
    if (!validateLectureOrg()) {
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
      entryPassword:
        lectureVisibility === 'private' ? lectureEntryPassword : undefined,
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
      // 登出成功后重定向到首页
      window.location.href = '/';
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
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'lecture' | 'createdOrg' | 'joinedOrg';
    id: string | number;
  } | null>(null);

  // 删除弹框提示语
  const getDeleteConfirmText = () => {
    if (!deleteTarget) {
      return '';
    }
    if (deleteTarget.type === 'createdOrg') {
      return '确认要解散该组织吗？';
    }
    if (deleteTarget.type === 'joinedOrg') {
      return '确认要脱离该组织吗？';
    }
    if (deleteTarget.type === 'lecture') {
      return '确认要删除该演讲吗？';
    }
    return '确认要删除吗？';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* 头部 */}
        <Header
          avatarUrl={currentUser.avatar_url || ''}
          displayName={currentUser.display_name}
          email={currentUser.email}
          onSignOut={handleSignOut}
        />
        {/* 快速统计 */}
        <StatsCards
          activeLecturesCount={
            myLectures.filter((l) => l.status === 'active').length
          }
          myLecturesCount={myLectures.length}
          myOrganizationsCount={myOrganizations.length}
          participatedLecturesCount={participatedLectures.length}
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <MyLecturesList
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            getStatusIcon={getStatusIcon}
            lectures={myLectures.map((l) => ({
              ...l,
              description: l.description || '',
            }))}
            onCreateLecture={() => setShowCreateLectureModal(true)}
            onDeleteLecture={(id) => {
              setDeleteTarget({ type: 'lecture', id });
              setShowDeleteConfirmModal(true);
            }}
          />
          <ParticipatedLecturesList
            formatDate={formatDate}
            getStatusBadge={getStatusBadge}
            getStatusIcon={getStatusIcon}
            lectures={participatedLectures.map((l) => ({
              ...l,
              description: l.description || '',
            }))}
          />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:mt-8">
          <CreatedOrganizationsList
            onCreateOrg={() => setShowCreateOrgModal(true)}
            onDeleteOrg={(id) => {
              setDeleteTarget({ type: 'createdOrg', id });
              setShowDeleteConfirmModal(true);
            }}
            organizations={myCreatedOrganizations}
          />
          <JoinedOrganizationsList
            onDeleteOrg={(id) => {
              setDeleteTarget({ type: 'joinedOrg', id });
              setShowDeleteConfirmModal(true);
            }}
            organizations={myJoinedOrganizations}
          />
        </div>
      </div>
      <CreateLectureModal
        errorMsg={errorMsg}
        lectureDesc={lectureDesc}
        lectureEntryPassword={lectureEntryPassword}
        lectureStartTime={lectureStartTime}
        lectureTitle={lectureTitle}
        lectureType={lectureType}
        lectureVisibility={lectureVisibility}
        myOrganizations={myOrganizations}
        onClose={resetForm}
        onCreate={handleCreateLecture}
        onLectureDescChange={setLectureDesc}
        onLectureEntryPasswordChange={setLectureEntryPassword}
        onLectureStartTimeChange={setLectureStartTime}
        onLectureTitleChange={setLectureTitle}
        onLectureTypeChange={setLectureType}
        onLectureVisibilityChange={setLectureVisibility}
        onOrgPasswordChange={setOrgPassword}
        onSelectedOrgIdChange={setSelectedOrgId}
        open={showCreateLectureModal}
        orgPassword={orgPassword}
        selectedOrgId={selectedOrgId}
      />
      <CreateOrgModal
        onClose={resetOrgForm}
        onCreate={handleCreateOrg}
        onOrgCreatePasswordChange={setOrgCreatePassword}
        onOrgDescChange={setOrgDesc}
        onOrgNameChange={setOrgName}
        open={showCreateOrgModal}
        orgCreatePassword={orgCreatePassword}
        orgDesc={orgDesc}
        orgErrorMsg={orgErrorMsg}
        orgName={orgName}
      />
      <DeleteConfirmModal
        onCancel={() => setShowDeleteConfirmModal(false)}
        onConfirm={() => setShowDeleteConfirmModal(false)}
        open={showDeleteConfirmModal}
        text={getDeleteConfirmText()}
      />
    </div>
  );
}
