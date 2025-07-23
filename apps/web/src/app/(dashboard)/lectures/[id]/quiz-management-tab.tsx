'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Separator } from '@repo/ui/components/separator';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import {
  FileText,
  Hash,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getMaterialStats } from '@/app/actions/materials';
import {
  clearQuizItems,
  deleteQuizItem,
  generateQuizItems,
  getPushedQuizItems,
  getQuizItems,
  pushQuizItem,
} from '@/app/actions/quiz';
import { QuizItemCard } from '@/components/quiz/quiz-item-card';
import { QuizItemPreviewDialog } from '@/components/quiz/quiz-item-preview';
import type { QuizItem } from '@/types';

interface QuizManagementTabProps {
  lectureId: string;
  lectureStatus?: 'not_started' | 'in_progress' | 'paused' | 'ended';
}

export default function QuizManagementTab({
  lectureId,
  lectureStatus,
}: QuizManagementTabProps) {
  const router = useRouter();
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [pushedQuizItems, setPushedQuizItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [selectedQuizItem, setSelectedQuizItem] = useState<QuizItem | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [generateCount, setGenerateCount] = useState('10');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pushed'>('all');
  const [materialStats, setMaterialStats] = useState<{
    totalCount: number;
    totalTextLength: number;
  }>({ totalCount: 0, totalTextLength: 0 });

  // 加载题目数据
  const loadQuizItems = useCallback(async () => {
    try {
      const result = await getQuizItems(lectureId);
      if (result.success && result.data) {
        setQuizItems(result.data);
      }
    } catch {
      toast.error('加载题目失败');
    } finally {
      setLoading(false);
    }
  }, [lectureId]);

  // 加载已推送的题目
  const loadPushedQuizItems = useCallback(async () => {
    try {
      const result = await getPushedQuizItems(lectureId);
      if (result.success && result.data) {
        setPushedQuizItems(result.data);
      }
    } catch {
      toast.error('加载已推送题目失败');
    }
  }, [lectureId]);

  // 加载材料统计信息
  const loadMaterialStats = useCallback(async () => {
    try {
      const result = await getMaterialStats(lectureId);
      if (result.success && result.data) {
        setMaterialStats({
          totalCount: result.data.totalCount,
          totalTextLength: result.data.totalTextLength,
        });
      }
    } catch {
      // 静默失败，不影响主流程
    }
  }, [lectureId]);

  useEffect(() => {
    loadQuizItems();
    loadPushedQuizItems();
    loadMaterialStats();
  }, [loadQuizItems, loadPushedQuizItems, loadMaterialStats]);

  // 生成题目
  const handleGenerate = async () => {
    const count = Number.parseInt(generateCount, 10);
    if (Number.isNaN(count) || count < 1 || count > 20) {
      toast.error('请输入 1-20 之间的数字');
      return;
    }

    setGenerating(true);
    setGenerationProgress('正在准备生成题目...');
    setShowGenerateDialog(false);

    try {
      setGenerationProgress('正在分析演讲内容...');
      const result = await generateQuizItems({
        lectureId,
        count,
      });

      if (result.success && result.data) {
        setGenerationProgress(`成功生成 ${result.data.length} 道题目！`);
        toast.success(`成功生成 ${result.data.length} 道题目`);
        await loadQuizItems();
        router.refresh();
      } else {
        throw new Error('error' in result ? result.error : '生成失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成题目失败');
    } finally {
      setGenerating(false);
      setGenerationProgress('');
    }
  };

  // 删除单个题目
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteQuizItem(id);
      if (result.success) {
        toast.success('删除成功');
        await loadQuizItems();
        router.refresh();
      } else {
        throw new Error('error' in result ? result.error : '删除失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  // 清空题库
  const handleClearAll = async () => {
    setLoading(true);
    try {
      // 删除所有题目
      await clearQuizItems(lectureId);

      toast.success('题库已清空');
      await loadQuizItems();
      router.refresh();
    } catch {
      toast.error('清空题库失败');
    } finally {
      setLoading(false);
      setShowClearDialog(false);
    }
  };

  // 推送题目
  const handlePush = async (quizId: string) => {
    setPushingId(quizId);
    try {
      const result = await pushQuizItem(lectureId, quizId);
      if (result.success) {
        toast.success(`成功推送题目给 ${result.data.pushedCount} 位参与者`);
        await loadQuizItems();
        await loadPushedQuizItems();
      } else {
        throw new Error('error' in result ? result.error : '推送失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '推送题目失败');
    } finally {
      setPushingId(null);
    }
  };

  // 过滤题目
  const displayItems = activeTab === 'pushed' ? pushedQuizItems : quizItems;
  const filteredQuizItems = displayItems.filter((item) =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 格式化文本长度
  const formatTextLength = (length: number) => {
    if (length > 10_000) {
      return `${(length / 1000).toFixed(1)}k 字`;
    }
    return `${length} 字`;
  };

  return (
    <div className="space-y-6">
      {/* 生成进度提示 */}
      {generating && generationProgress && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-blue-600 text-sm dark:text-blue-400">
              {generationProgress}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 题目列表卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>题库管理</CardTitle>
              <CardDescription>
                {activeTab === 'all'
                  ? `共 ${quizItems.length} 道题目`
                  : `已推送 ${pushedQuizItems.length} 道题目`}
                {displayItems.length > 0 &&
                  filteredQuizItems.length < displayItems.length &&
                  ` • 显示 ${filteredQuizItems.length} 道`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'all' && (
                <Button
                  disabled={generating}
                  onClick={() => setShowGenerateDialog(true)}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成题目
                    </>
                  )}
                </Button>
              )}
              <Button
                disabled={loading}
                onClick={() => {
                  loadQuizItems();
                  loadPushedQuizItems();
                }}
                size="icon"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {(quizItems.length > 0 || pushedQuizItems.length > 0) && (
          <>
            <Separator />
            <div className="p-6">
              <Tabs
                className="w-full"
                onValueChange={(v) => setActiveTab(v as 'all' | 'pushed')}
                value={activeTab}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="all">
                    全部题目 ({quizItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="pushed">
                    已推送 ({pushedQuizItems.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="mb-4 flex items-center justify-between">
                <Input
                  className="max-w-sm"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索题目..."
                  value={searchQuery}
                />
                {activeTab === 'all' && (
                  <Button
                    onClick={() => setShowClearDialog(true)}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    清空题库
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        <CardContent className="p-6 pt-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {activeTab === 'all' ? (
                <>
                  <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold text-lg">
                    还没有生成任何题目
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    基于演讲材料智能生成测验题目
                  </p>
                  <Button onClick={() => setShowGenerateDialog(true)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成第一批题目
                  </Button>
                </>
              ) : (
                <>
                  <Send className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 font-semibold text-lg">
                    还没有推送任何题目
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    在演讲进行中推送题目给参与者
                  </p>
                </>
              )}
            </div>
          ) : filteredQuizItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">没有找到匹配的题目</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizItems.map((quizItem) => (
                <QuizItemCard
                  key={quizItem.id}
                  onClick={() => {
                    setSelectedQuizItem(quizItem);
                    setShowPreview(true);
                  }}
                  quizItem={quizItem}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览对话框 */}
      <QuizItemPreviewDialog
        isDeleting={deletingId === selectedQuizItem?.id}
        isPushing={pushingId === selectedQuizItem?.id}
        lectureStatus={lectureStatus}
        onDelete={handleDelete}
        onOpenChange={setShowPreview}
        onPush={handlePush}
        open={showPreview}
        quizItem={selectedQuizItem}
      />

      {/* 生成题目对话框 */}
      <Dialog onOpenChange={setShowGenerateDialog} open={showGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>生成题目</DialogTitle>
            <DialogDescription>
              基于演讲材料和转录内容智能生成题目
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 材料统计信息 */}
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-3 font-medium text-sm">材料信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">材料数量：</span>
                    <span className="font-medium">
                      {materialStats.totalCount} 个
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">文本总长：</span>
                    <span className="font-medium">
                      {formatTextLength(materialStats.totalTextLength)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="count">生成数量</Label>
              <Input
                id="count"
                max="20"
                min="1"
                onChange={(e) => setGenerateCount(e.target.value)}
                placeholder="建议不超过 20 个"
                type="number"
                value={generateCount}
              />
              <p className="mt-1 text-muted-foreground text-sm">
                建议每次生成 5-10 道题目，确保质量
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowGenerateDialog(false)}
              variant="outline"
            >
              取消
            </Button>
            <Button onClick={handleGenerate}>
              <Sparkles className="mr-2 h-4 w-4" />
              开始生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清空确认对话框 */}
      <AlertDialog onOpenChange={setShowClearDialog} open={showClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空题库？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除所有 {quizItems.length} 道题目，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearAll}
            >
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
