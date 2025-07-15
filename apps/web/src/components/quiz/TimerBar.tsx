"use client";

import { Progress } from "@repo/ui/components/progress";
import { AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface TimerBarProps {
	totalTime: number; // 总时间（秒）
	onTimeUp: () => void; // 时间到了的回调
	isActive?: boolean; // 是否激活计时器
	isPaused?: boolean; // 是否暂停
}

export const TimerBar = ({
	totalTime,
	onTimeUp,
	isActive = true,
	isPaused = false,
}: TimerBarProps) => {
	const [timeLeft, setTimeLeft] = useState(totalTime);
	const [isTimeUp, setIsTimeUp] = useState(false);

	useEffect(() => {
		setTimeLeft(totalTime);
		setIsTimeUp(false);
	}, [totalTime]);

	useEffect(() => {
		if (!isActive || isPaused || isTimeUp) return;

		const timer = setInterval(() => {
			setTimeLeft((prevTime) => {
				if (prevTime <= 1) {
					setIsTimeUp(true);
					onTimeUp();
					return 0;
				}
				return prevTime - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [isActive, isPaused, isTimeUp, onTimeUp]);

	const progressPercentage = (timeLeft / totalTime) * 100;
	const isWarning = timeLeft <= 10 && timeLeft > 5;
	const isDanger = timeLeft <= 5;

	const getProgressColor = () => {
		if (isDanger) return "bg-red-500";
		if (isWarning) return "bg-yellow-500";
		return "bg-blue-500";
	};

	const getTextColor = () => {
		if (isDanger) return "text-red-600";
		if (isWarning) return "text-yellow-600";
		return "text-blue-600";
	};

	const getIcon = () => {
		if (isDanger) return <AlertTriangle className="w-5 h-5" />;
		return <Clock className="w-5 h-5" />;
	};

	return (
		<div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm border p-4">
			<div className="flex items-center justify-between mb-2">
				<div className={`flex items-center gap-2 ${getTextColor()}`}>
					{getIcon()}
					<span className="font-medium">
						{isTimeUp ? "时间到！" : `剩余时间: ${timeLeft}秒`}
					</span>
				</div>

				<div className="text-sm text-gray-500">
					{isPaused ? "已暂停" : isActive ? "进行中" : "未开始"}
				</div>
			</div>

			<div className="relative">
				<Progress value={progressPercentage} className="h-3" />
				<div
					className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${getProgressColor()}`}
					style={{ width: `${progressPercentage}%` }}
				/>
			</div>

			{isDanger && !isTimeUp && (
				<div className="mt-2 text-sm text-red-600 font-medium animate-pulse">
					请尽快作答！
				</div>
			)}
		</div>
	);
};
