"use client";

import { Badge } from "@repo/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import { Clock, Target, TrendingUp, Users } from "lucide-react";
import type { QuizStats } from "@/types";

interface StatsDisplayProps {
	stats: QuizStats;
	className?: string;
}

export const StatsDisplay = ({ stats, className = "" }: StatsDisplayProps) => {
	const accuracyPercentage = Math.round(stats.accuracy_rate * 100);
	const averageLatencySeconds = Math.round(stats.average_latency / 1000);

	return (
		<Card className={`w-full ${className}`}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="w-5 h-5" />
					答题统计
				</CardTitle>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* 基本统计 */}
				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-100 rounded-lg">
							<Users className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<div className="text-sm text-gray-600">总答题数</div>
							<div className="text-2xl font-bold">{stats.total_attempts}</div>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="p-2 bg-green-100 rounded-lg">
							<TrendingUp className="w-5 h-5 text-green-600" />
						</div>
						<div>
							<div className="text-sm text-gray-600">正确率</div>
							<div className="text-2xl font-bold text-green-600">
								{accuracyPercentage}%
							</div>
						</div>
					</div>
				</div>

				{/* 正确率进度条 */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">正确率</span>
						<Badge
							variant={accuracyPercentage >= 70 ? "default" : "destructive"}
						>
							{stats.correct_attempts}/{stats.total_attempts}
						</Badge>
					</div>
					<Progress value={accuracyPercentage} className="h-2" />
				</div>

				{/* 平均答题时间 */}
				<div className="flex items-center gap-3">
					<div className="p-2 bg-orange-100 rounded-lg">
						<Clock className="w-5 h-5 text-orange-600" />
					</div>
					<div>
						<div className="text-sm text-gray-600">平均答题时间</div>
						<div className="text-lg font-semibold">
							{averageLatencySeconds}s
						</div>
					</div>
				</div>

				{/* 选项分布 */}
				<div className="space-y-3">
					<h4 className="text-sm font-medium text-gray-700">选项分布</h4>
					<div className="space-y-2">
						{stats.option_distribution.map((count, index) => {
							const percentage =
								stats.total_attempts > 0
									? Math.round((count / stats.total_attempts) * 100)
									: 0;

							return (
								<div
									key={`${stats.quiz_id}-option-${index}`}
									className="space-y-1"
								>
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium">
											选项 {String.fromCharCode(65 + index)}
										</span>
										<span className="text-gray-600">
											{count}人 ({percentage}%)
										</span>
									</div>
									<Progress value={percentage} className="h-1" />
								</div>
							);
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
