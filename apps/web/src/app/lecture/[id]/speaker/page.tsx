"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import {
	ArrowLeft,
	BarChart3,
	MessageCircle,
	Pause,
	Play,
	Target,
	TrendingUp,
	Users,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { StatsDisplay } from "@/components/quiz/StatsDisplay";
import {
	getActiveLectureQuiz,
	getCurrentUser,
	getLectureById,
	getLectureQuizzes,
	getLectureStats,
	getQuizStats,
} from "@/lib/mock-data";

interface SpeakerViewProps {
	params: Promise<{ id: string }>;
}

export default function SpeakerView({ params }: SpeakerViewProps) {
	const [activeTab, setActiveTab] = useState("current");
	const [isQuizActive, setIsQuizActive] = useState(false);

	const resolvedParams = use(params) as { id: string };
	const currentUser = getCurrentUser();
	const lecture = getLectureById(resolvedParams.id);
	const activeQuiz = getActiveLectureQuiz(resolvedParams.id);
	const allQuizzes = getLectureQuizzes(resolvedParams.id);
	const lectureStats = getLectureStats(resolvedParams.id);
	const activeQuizStats = activeQuiz ? getQuizStats(activeQuiz.id) : null;

	const handleStartQuiz = () => {
		setIsQuizActive(true);
		// 模拟启动题目
		console.log("启动题目:", activeQuiz?.id);
	};

	const handleStopQuiz = () => {
		setIsQuizActive(false);
		// 模拟停止题目
		console.log("停止题目:", activeQuiz?.id);
	};

	if (!lecture) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardContent className="p-8 text-center">
						<h2 className="text-xl font-semibold mb-2">讲座不存在</h2>
						<p className="text-gray-600 mb-4">请检查链接是否正确</p>
						<Button asChild>
							<Link href="/">返回首页</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// 检查是否是讲座的所有者
	if (lecture.owner_id !== currentUser.id) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardContent className="p-8 text-center">
						<h2 className="text-xl font-semibold mb-2">无权限访问</h2>
						<p className="text-gray-600 mb-4">
							只有讲座创建者才能查看演讲者视图
						</p>
						<Button asChild>
							<Link href={`/lecture/${resolvedParams.id}`}>进入听众视图</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container max-w-7xl mx-auto px-4 py-6">
				{/* 头部 */}
				<div className="mb-6">
					<div className="flex items-center gap-4 mb-4">
						<Button variant="ghost" size="sm" asChild>
							<Link href="/">
								<ArrowLeft className="w-4 h-4 mr-2" />
								返回首页
							</Link>
						</Button>
						<Badge
							className={
								lecture.status === "active"
									? "bg-green-100 text-green-800"
									: "bg-gray-100 text-gray-800"
							}
						>
							{lecture.status === "active" ? "进行中" : "已结束"}
						</Badge>
						<Badge variant="outline">演讲者视图</Badge>
					</div>

					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								{lecture.title}
							</h1>
							<p className="text-gray-600 mt-1">{lecture.description}</p>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-1 text-sm text-gray-600">
								<Users className="w-4 h-4" />
								{lecture.participants_count} 人参与
							</div>
							<Button variant="outline" size="sm" asChild>
								<Link href={`/lecture/${resolvedParams.id}`}>
									<MessageCircle className="w-4 h-4 mr-2" />
									听众视图
								</Link>
							</Button>
						</div>
					</div>
				</div>

				{/* 主要内容 */}
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="current">当前题目</TabsTrigger>
						<TabsTrigger value="stats">统计概览</TabsTrigger>
						<TabsTrigger value="history">历史题目</TabsTrigger>
					</TabsList>

					{/* 当前题目 */}
					<TabsContent value="current" className="mt-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* 题目控制 */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<MessageCircle className="w-5 h-5" />
										题目控制
									</CardTitle>
								</CardHeader>
								<CardContent>
									{activeQuiz ? (
										<div className="space-y-4">
											<div className="p-4 bg-blue-50 rounded-lg">
												<h3 className="font-medium text-blue-900 mb-2">
													当前题目
												</h3>
												<p className="text-blue-800">{activeQuiz.question}</p>
											</div>

											<div className="space-y-2">
												{activeQuiz.options.map((option, index) => (
													<div
														key={`${activeQuiz.id}-current-option-${index}`}
														className={`p-3 rounded-lg border ${
															index === activeQuiz.answer
																? "bg-green-50 border-green-200"
																: "bg-gray-50 border-gray-200"
														}`}
													>
														<div className="flex items-center gap-2">
															<span className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm font-medium">
																{String.fromCharCode(65 + index)}
															</span>
															<span className="flex-1">{option}</span>
															{index === activeQuiz.answer && (
																<Badge className="bg-green-100 text-green-800">
																	正确答案
																</Badge>
															)}
														</div>
													</div>
												))}
											</div>

											<div className="flex gap-2 pt-4">
												<Button
													onClick={handleStartQuiz}
													disabled={isQuizActive}
													className="flex-1"
												>
													<Play className="w-4 h-4 mr-2" />
													{isQuizActive ? "题目进行中" : "开始答题"}
												</Button>
												<Button
													onClick={handleStopQuiz}
													disabled={!isQuizActive}
													variant="outline"
													className="flex-1"
												>
													<Pause className="w-4 h-4 mr-2" />
													停止答题
												</Button>
											</div>
										</div>
									) : (
										<div className="text-center py-8">
											<MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
											<p className="text-gray-500">暂无活跃题目</p>
											<Button className="mt-4" size="sm">
												<MessageCircle className="w-4 h-4 mr-2" />
												发布新题目
											</Button>
										</div>
									)}
								</CardContent>
							</Card>

							{/* 实时统计 */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<BarChart3 className="w-5 h-5" />
										实时统计
									</CardTitle>
								</CardHeader>
								<CardContent>
									{activeQuizStats ? (
										<div className="space-y-6">
											{/* 基本统计 */}
											<div className="grid grid-cols-2 gap-4">
												<div className="text-center">
													<div className="text-3xl font-bold text-green-600">
														{Math.round(activeQuizStats.accuracy_rate * 100)}%
													</div>
													<div className="text-sm text-gray-600">正确率</div>
												</div>
												<div className="text-center">
													<div className="text-3xl font-bold text-blue-600">
														{activeQuizStats.total_attempts}
													</div>
													<div className="text-sm text-gray-600">参与人数</div>
												</div>
											</div>

											{/* 正确率进度条 */}
											<div className="space-y-2">
												<div className="flex justify-between text-sm">
													<span>正确率</span>
													<span>
														{activeQuizStats.correct_attempts}/
														{activeQuizStats.total_attempts}
													</span>
												</div>
												<Progress
													value={Math.round(
														activeQuizStats.accuracy_rate * 100,
													)}
													className="h-2"
												/>
											</div>

											{/* 选项分布 */}
											<div className="space-y-3">
												<h4 className="font-medium">选项分布</h4>
												{activeQuizStats.option_distribution.map(
													(count, index) => {
														const percentage =
															activeQuizStats.total_attempts > 0
																? Math.round(
																		(count / activeQuizStats.total_attempts) *
																			100,
																	)
																: 0;

														return (
															<div
																key={`${activeQuizStats.quiz_id}-speaker-option-${index}`}
																className="space-y-1"
															>
																<div className="flex justify-between text-sm">
																	<span>
																		选项 {String.fromCharCode(65 + index)}
																	</span>
																	<span>
																		{count}人 ({percentage}%)
																	</span>
																</div>
																<Progress value={percentage} className="h-1" />
															</div>
														);
													},
												)}
											</div>
										</div>
									) : (
										<div className="text-center py-8">
											<BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
											<p className="text-gray-500">暂无统计数据</p>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					{/* 统计概览 */}
					<TabsContent value="stats" className="mt-6">
						<div className="space-y-6">
							{/* 总体统计 */}
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<Card>
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-100 rounded-lg">
												<Users className="w-5 h-5 text-blue-600" />
											</div>
											<div>
												<div className="text-2xl font-bold">
													{lecture.participants_count}
												</div>
												<div className="text-sm text-gray-600">参与人数</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-green-100 rounded-lg">
												<MessageCircle className="w-5 h-5 text-green-600" />
											</div>
											<div>
												<div className="text-2xl font-bold">
													{allQuizzes.length}
												</div>
												<div className="text-sm text-gray-600">题目总数</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-purple-100 rounded-lg">
												<Target className="w-5 h-5 text-purple-600" />
											</div>
											<div>
												<div className="text-2xl font-bold">
													{lectureStats
														? Math.round(lectureStats.overall_accuracy * 100)
														: 0}
													%
												</div>
												<div className="text-sm text-gray-600">总体正确率</div>
											</div>
										</div>
									</CardContent>
								</Card>

								<Card>
									<CardContent className="p-4">
										<div className="flex items-center gap-3">
											<div className="p-2 bg-orange-100 rounded-lg">
												<TrendingUp className="w-5 h-5 text-orange-600" />
											</div>
											<div>
												<div className="text-2xl font-bold">
													{lectureStats
														? Math.round(lectureStats.engagement_rate * 100)
														: 0}
													%
												</div>
												<div className="text-sm text-gray-600">参与率</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>

							{/* 详细统计 */}
							{activeQuizStats && <StatsDisplay stats={activeQuizStats} />}
						</div>
					</TabsContent>

					{/* 历史题目 */}
					<TabsContent value="history" className="mt-6">
						<Card>
							<CardHeader>
								<CardTitle>历史题目</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{allQuizzes.map((quiz, index) => {
										const stats = getQuizStats(quiz.id);
										return (
											<div key={quiz.id} className="border rounded-lg p-4">
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-2">
															<Badge variant="outline">题目 {index + 1}</Badge>
															<Badge
																className={
																	quiz.is_active
																		? "bg-green-100 text-green-800"
																		: "bg-gray-100 text-gray-800"
																}
															>
																{quiz.is_active ? "进行中" : "已结束"}
															</Badge>
														</div>
														<h3 className="font-medium mb-2">
															{quiz.question}
														</h3>
														<p className="text-sm text-gray-500">
															发布时间: {quiz.ts.toLocaleString("zh-CN")}
														</p>
													</div>
													<div className="text-right">
														{stats && (
															<div className="space-y-1">
																<div className="text-sm text-gray-600">
																	正确率:{" "}
																	<span className="font-medium">
																		{Math.round(stats.accuracy_rate * 100)}%
																	</span>
																</div>
																<div className="text-sm text-gray-600">
																	参与:{" "}
																	<span className="font-medium">
																		{stats.total_attempts}人
																	</span>
																</div>
															</div>
														)}
													</div>
												</div>
											</div>
										);
									})}

									{allQuizzes.length === 0 && (
										<div className="text-center py-8">
											<MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
											<p className="text-gray-500">还没有发布任何题目</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
