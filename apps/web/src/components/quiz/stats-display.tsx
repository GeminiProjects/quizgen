'use client';

import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Progress } from '@repo/ui/components/progress';
import { Clock, Target, TrendingUp, Users } from 'lucide-react';
import type { QuizStats } from '@/types';

interface StatsDisplayProps {
  stats: QuizStats;
  className?: string;
}

export const StatsDisplay = ({ stats, className = '' }: StatsDisplayProps) => {
  const accuracyPercentage = Math.round(stats.accuracy_rate * 100);
  const averageLatencySeconds = Math.round(stats.average_latency / 1000);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          答题统计
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 基本统计 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-gray-600 text-sm">总答题数</div>
              <div className="font-bold text-2xl">{stats.total_attempts}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-gray-600 text-sm">正确率</div>
              <div className="font-bold text-2xl text-green-600">
                {accuracyPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* 正确率进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">正确率</span>
            <Badge
              variant={accuracyPercentage >= 70 ? 'default' : 'destructive'}
            >
              {stats.correct_attempts}/{stats.total_attempts}
            </Badge>
          </div>
          <Progress className="h-2" value={accuracyPercentage} />
        </div>

        {/* 平均答题时间 */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-2">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <div className="text-gray-600 text-sm">平均答题时间</div>
            <div className="font-semibold text-lg">
              {averageLatencySeconds}s
            </div>
          </div>
        </div>

        {/* 选项分布 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">选项分布</h4>
          <div className="space-y-2">
            {stats.option_distribution.map((count, index) => {
              const percentage =
                stats.total_attempts > 0
                  ? Math.round((count / stats.total_attempts) * 100)
                  : 0;

              return (
                <div
                  className="space-y-1"
                  key={`${stats.quiz_id}-option-${index}`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      选项 {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-gray-600">
                      {count}人 ({percentage}%)
                    </span>
                  </div>
                  <Progress className="h-1" value={percentage} />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
