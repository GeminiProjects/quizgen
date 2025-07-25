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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Progress } from '@repo/ui/components/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Skeleton } from '@repo/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle,
  Eye,
  Filter,
  MessageSquare,
  Percent,
  Search,
  Timer,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getQuizAnalytics } from '@/app/actions/quiz-analytics';

interface QuizAnalytics {
  quizId: string;
  question: string;
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number;
  options: string[];
  optionStats: {
    option: number;
    text: string;
    count: number;
    percentage: number;
    isCorrect: boolean;
  }[];
  avgResponseTime: number;
  pushedAt: string | null;
}

interface AnalyticsTabProps {
  lectureId: string;
}

type SortField =
  | 'totalAttempts'
  | 'correctRate'
  | 'avgResponseTime'
  | 'pushedAt';
type SortOrder = 'asc' | 'desc';

export default function AnalyticsTab({ lectureId }: AnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<QuizAnalytics[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pushed' | 'unpushed'
  >('all');
  const [sortField, setSortField] = useState<SortField>('totalAttempts');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAnalytics | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const result = await getQuizAnalytics(lectureId);
        if (result.success && result.data) {
          setAnalytics(result.data);
        } else {
          toast.error('加载数据分析失败');
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast.error('加载数据分析失败');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [lectureId]);

  // 过滤和排序题目
  const filteredAndSortedQuizzes = useMemo(() => {
    let filtered = analytics;

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter((quiz) =>
        quiz.question.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 状态过滤
    if (filterStatus === 'pushed') {
      filtered = filtered.filter((quiz) => quiz.pushedAt !== null);
    } else if (filterStatus === 'unpushed') {
      filtered = filtered.filter((quiz) => quiz.pushedAt === null);
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string | null = a[sortField];
      let bValue: number | string | null = b[sortField];

      if (sortField === 'pushedAt') {
        aValue = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
        bValue = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
      }

      if (aValue === null || aValue === undefined) {
        return 1;
      }
      if (bValue === null || bValue === undefined) {
        return -1;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

    return sorted;
  }, [analytics, searchQuery, filterStatus, sortField, sortOrder]);

  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton className="h-64 w-full" key={i} />
        ))}
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-2 font-medium text-lg">暂无数据</p>
        <p className="text-muted-foreground text-sm">
          还没有生成和推送任何测验题目
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 总体统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">总题目数</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">{analytics.length}</p>
            <p className="text-muted-foreground text-xs">
              已推送 {analytics.filter((a) => a.pushedAt).length} 道
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">总答题次数</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {analytics.reduce((sum, a) => sum + a.totalAttempts, 0)}
            </p>
            <p className="text-muted-foreground text-xs">
              平均每题{' '}
              {analytics.length > 0
                ? (
                    analytics.reduce((sum, a) => sum + a.totalAttempts, 0) /
                    analytics.length
                  ).toFixed(1)
                : '0'}{' '}
              人次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">平均正确率</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {analytics.length > 0
                ? (
                    (analytics.reduce((sum, a) => sum + a.correctRate, 0) /
                      analytics.length) *
                    100
                  ).toFixed(1)
                : '0'}
              %
            </p>
            <p className="text-muted-foreground text-xs">
              所有题目的平均正确率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">平均答题时间</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {analytics.length > 0
                ? (
                    analytics.reduce((sum, a) => sum + a.avgResponseTime, 0) /
                    analytics.length
                  ).toFixed(1)
                : '0'}
              s
            </p>
            <p className="text-muted-foreground text-xs">所有题目的平均时间</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索题目内容..."
            value={searchQuery}
          />
        </div>
        <Select
          onValueChange={(value) =>
            setFilterStatus(value as 'all' | 'pushed' | 'unpushed')
          }
          value={filterStatus}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="过滤状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部题目</SelectItem>
            <SelectItem value="pushed">已推送</SelectItem>
            <SelectItem value="unpushed">未推送</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 题目表格 */}
      <Card>
        <CardHeader>
          <CardTitle>题目分析</CardTitle>
          <CardDescription>
            共 {filteredAndSortedQuizzes.length} 道题目
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>题目内容</TableHead>
                <TableHead>
                  <Button
                    className="h-auto p-0"
                    onClick={() => handleSort('totalAttempts')}
                    variant="ghost"
                  >
                    答题人数
                    {sortField === 'totalAttempts' &&
                      (sortOrder === 'desc' ? (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    className="h-auto p-0"
                    onClick={() => handleSort('correctRate')}
                    variant="ghost"
                  >
                    正确率
                    {sortField === 'correctRate' &&
                      (sortOrder === 'desc' ? (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    className="h-auto p-0"
                    onClick={() => handleSort('avgResponseTime')}
                    variant="ghost"
                  >
                    平均时间
                    {sortField === 'avgResponseTime' &&
                      (sortOrder === 'desc' ? (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    className="h-auto p-0"
                    onClick={() => handleSort('pushedAt')}
                    variant="ghost"
                  >
                    状态
                    {sortField === 'pushedAt' &&
                      (sortOrder === 'desc' ? (
                        <ArrowDown className="ml-1 h-3 w-3" />
                      ) : (
                        <ArrowUp className="ml-1 h-3 w-3" />
                      ))}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedQuizzes.map((quiz, index) => {
                const level =
                  quiz.correctRate >= 0.7
                    ? 'good'
                    : quiz.correctRate >= 0.4
                      ? 'medium'
                      : 'poor';
                const levelConfig = {
                  good: { color: 'text-success', label: '良好' },
                  medium: { color: 'text-warning', label: '一般' },
                  poor: { color: 'text-destructive', label: '较差' },
                };

                return (
                  <TableRow key={quiz.quizId}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="line-clamp-2">{quiz.question}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {quiz.totalAttempts}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {quiz.totalAttempts > 0 ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${levelConfig[level].color}`}
                          >
                            {(quiz.correctRate * 100).toFixed(1)}%
                          </span>
                          <Badge
                            className={`text-xs ${
                              level === 'good'
                                ? 'bg-success/10 text-success'
                                : level === 'medium'
                                  ? 'bg-warning/10 text-warning'
                                  : 'bg-destructive/10 text-destructive'
                            }`}
                            variant="secondary"
                          >
                            {levelConfig[level].label}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {quiz.totalAttempts > 0 ? (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <span>{quiz.avgResponseTime.toFixed(1)}s</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {quiz.pushedAt ? (
                        <Badge
                          className="bg-success/10 text-success"
                          variant="secondary"
                        >
                          已推送
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未推送</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => setSelectedQuiz(quiz)}
                        size="sm"
                        variant="ghost"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">查看详情</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredAndSortedQuizzes.length === 0 && (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 font-medium text-lg">没有找到题目</p>
              <p className="text-muted-foreground text-sm">
                {searchQuery || filterStatus !== 'all'
                  ? '请尝试调整搜索条件'
                  : '还没有生成任何测验题目'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 题目详情对话框 */}
      <Dialog
        onOpenChange={(open) => !open && setSelectedQuiz(null)}
        open={!!selectedQuiz}
      >
        <DialogContent className="max-w-2xl">
          {selectedQuiz && (
            <>
              <DialogHeader>
                <DialogTitle>题目详情</DialogTitle>
                <DialogDescription className="mt-2 text-base">
                  {selectedQuiz.question}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* 总体统计 */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">答题人数</p>
                    <p className="font-semibold text-2xl">
                      {selectedQuiz.totalAttempts}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">正确率</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-semibold text-2xl">
                        {(selectedQuiz.correctRate * 100).toFixed(1)}%
                      </p>
                      <p className="text-muted-foreground text-sm">
                        ({selectedQuiz.correctAttempts}/
                        {selectedQuiz.totalAttempts})
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                      平均答题时间
                    </p>
                    <p className="font-semibold text-2xl">
                      {selectedQuiz.avgResponseTime.toFixed(1)}s
                    </p>
                  </div>
                </div>

                {/* 推送时间 */}
                {selectedQuiz.pushedAt && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-muted-foreground text-sm">
                      推送时间：
                      {new Date(selectedQuiz.pushedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}

                {/* 选项分布 */}
                <div className="space-y-3">
                  <h4 className="font-medium">选项分布</h4>
                  {selectedQuiz.optionStats.map((stat) => (
                    <div className="space-y-2" key={stat.option}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-muted font-medium text-xs">
                            {String.fromCharCode(65 + stat.option)}
                          </span>
                          <span className="text-muted-foreground">
                            {stat.text}
                          </span>
                          {stat.isCorrect && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {stat.percentage.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground">
                            ({stat.count}人)
                          </span>
                        </div>
                      </div>
                      <Progress
                        className="h-2"
                        indicatorClassName={
                          stat.isCorrect ? 'bg-success' : undefined
                        }
                        value={stat.percentage}
                      />
                    </div>
                  ))}
                </div>

                {/* 正确率指示器 */}
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    {selectedQuiz.correctRate >= 0.7 ? (
                      <CheckCircle className="h-6 w-6 text-success" />
                    ) : selectedQuiz.correctRate >= 0.4 ? (
                      <Percent className="h-6 w-6 text-warning" />
                    ) : (
                      <XCircle className="h-6 w-6 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedQuiz.correctRate >= 0.7
                        ? '掌握良好'
                        : selectedQuiz.correctRate >= 0.4
                          ? '基本掌握'
                          : '需要加强'}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {selectedQuiz.correctRate >= 0.7
                        ? '大部分听众理解了这个知识点'
                        : selectedQuiz.correctRate >= 0.4
                          ? '部分听众需要更多讲解'
                          : '建议重点讲解这个知识点'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
