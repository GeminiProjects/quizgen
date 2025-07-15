"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { ArrowLeft, Clock, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { QuestionPanel } from "@/components/quiz/QuestionPanel";
import { TimerBar } from "@/components/quiz/TimerBar";
import {
	getActiveLectureQuiz,
	getCurrentUser,
	getLectureById,
	getQuizStats,
} from "@/lib/mock-data";
import type { QuizStatus } from "@/types";

interface AudienceViewProps {
	params: Promise<{ id: string }>;
}

export default function AudienceView({ params }: AudienceViewProps) {
	const [quizStatus, setQuizStatus] = useState<QuizStatus>("waiting");
	const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
	const [isCorrect, setIsCorrect] = useState<boolean>(false);
	const [timeLeft, setTimeLeft] = useState<number>(30);

	const resolvedParams = use(params) as { id: string };
	const currentUser = getCurrentUser();
	const lecture = getLectureById(resolvedParams.id);
	const activeQuiz = getActiveLectureQuiz(resolvedParams.id);
	const quizStats = activeQuiz ? getQuizStats(activeQuiz.id) : null;

	useEffect(() => {
		if (activeQuiz) {
			setQuizStatus("active");
			setTimeLeft(activeQuiz.time_limit);
		} else {
			setQuizStatus("waiting");
		}
	}, [activeQuiz]);

	const handleSubmitAnswer = (answer: number) => {
		if (!activeQuiz) return;

		setSelectedAnswer(answer);
		setIsCorrect(answer === activeQuiz.answer);
		setQuizStatus("submitted");

		// 模拟提交答案到服务器
		console.log("提交答案:", {
			quizId: activeQuiz.id,
			answer,
			userId: currentUser.id,
		});
	};

	const handleTimeUp = () => {
		if (quizStatus === "active") {
			setQuizStatus("expired");
		}
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

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container max-w-4xl mx-auto px-4 py-6">
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
					</div>

					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								{lecture.title}
							</h1>
							<p className="text-gray-600 mt-1">{lecture.description}</p>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<Avatar className="w-8 h-8">
									<AvatarImage
										src={lecture.owner.avatar_url}
										alt={lecture.owner.display_name}
									/>
									<AvatarFallback>
										{lecture.owner.display_name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div>
									<div className="text-sm font-medium">
										{lecture.owner.display_name}
									</div>
									<div className="text-xs text-gray-500">演讲者</div>
								</div>
							</div>
							<div className="flex items-center gap-1 text-sm text-gray-600">
								<Users className="w-4 h-4" />
								{lecture.participants_count} 人参与
							</div>
						</div>
					</div>
				</div>

				{/* 主要内容区域 */}
				<div className="space-y-6">
					{/* 状态指示 */}
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center justify-center gap-2">
								{quizStatus === "waiting" && (
									<>
										<Clock className="w-5 h-5 text-blue-600" />
										<span className="text-blue-600 font-medium">
											等待演讲者发布题目...
										</span>
									</>
								)}
								{quizStatus === "active" && (
									<>
										<MessageCircle className="w-5 h-5 text-green-600" />
										<span className="text-green-600 font-medium">
											请回答下面的问题
										</span>
									</>
								)}
								{quizStatus === "submitted" && (
									<>
										<MessageCircle className="w-5 h-5 text-purple-600" />
										<span className="text-purple-600 font-medium">
											{isCorrect ? "回答正确！" : "回答错误，正确答案已显示"}
										</span>
									</>
								)}
								{quizStatus === "expired" && (
									<>
										<Clock className="w-5 h-5 text-red-600" />
										<span className="text-red-600 font-medium">
											时间已到，正确答案已显示
										</span>
									</>
								)}
							</div>
						</CardContent>
					</Card>

					{/* 计时器 */}
					{quizStatus === "active" && activeQuiz && (
						<TimerBar
							totalTime={activeQuiz.time_limit}
							onTimeUp={handleTimeUp}
							isActive={true}
						/>
					)}

					{/* 题目面板 */}
					{activeQuiz && (
						<QuestionPanel
							quiz={activeQuiz}
							onSubmitAnswer={handleSubmitAnswer}
							userAnswer={selectedAnswer ?? undefined}
							isCorrect={isCorrect}
							showResult={
								quizStatus === "submitted" || quizStatus === "expired"
							}
							timeLeft={timeLeft}
						/>
					)}

					{/* 等待状态的占位符 */}
					{quizStatus === "waiting" && (
						<Card className="w-full max-w-2xl mx-auto">
							<CardContent className="p-12 text-center">
								<div className="space-y-4">
									<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
										<MessageCircle className="w-8 h-8 text-blue-600" />
									</div>
									<div>
										<h3 className="text-lg font-medium text-gray-900">
											等待题目发布
										</h3>
										<p className="text-gray-600 mt-1">
											演讲者将在适当的时候发布互动问题
										</p>
									</div>
									<div className="animate-pulse">
										<div className="flex justify-center gap-1">
											<div className="w-2 h-2 bg-blue-600 rounded-full"></div>
											<div className="w-2 h-2 bg-blue-600 rounded-full animation-delay-75"></div>
											<div className="w-2 h-2 bg-blue-600 rounded-full animation-delay-150"></div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* 统计信息 */}
					{quizStats &&
						(quizStatus === "submitted" || quizStatus === "expired") && (
							<Card className="w-full max-w-2xl mx-auto">
								<CardHeader>
									<CardTitle className="text-lg">答题统计</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-4 text-center">
										<div>
											<div className="text-2xl font-bold text-green-600">
												{Math.round(quizStats.accuracy_rate * 100)}%
											</div>
											<div className="text-sm text-gray-600">正确率</div>
										</div>
										<div>
											<div className="text-2xl font-bold text-blue-600">
												{quizStats.total_attempts}
											</div>
											<div className="text-sm text-gray-600">参与人数</div>
										</div>
									</div>
								</CardContent>
							</Card>
						)}
				</div>
			</div>
		</div>
	);
}
