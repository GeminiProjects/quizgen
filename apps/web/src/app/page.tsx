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
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	Play,
	Plus,
	Users,
} from "lucide-react";
import Link from "next/link";
import {
	getCurrentUser,
	getUserLectures,
	getUserParticipatedLectures,
} from "@/lib/mock-data";

export default function Dashboard() {
	const currentUser = getCurrentUser();
	const myLectures = getUserLectures(currentUser.id);
	const participatedLectures = getUserParticipatedLectures(currentUser.id);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "active":
				return (
					<Badge className="bg-green-100 text-green-800 hover:bg-green-200">
						进行中
					</Badge>
				);
			case "pending":
				return (
					<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
						待开始
					</Badge>
				);
			case "completed":
				return (
					<Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
						已结束
					</Badge>
				);
			default:
				return <Badge variant="secondary">{status}</Badge>;
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "active":
				return <Play className="w-4 h-4 text-green-600" />;
			case "pending":
				return <Clock className="w-4 h-4 text-blue-600" />;
			case "completed":
				return <CheckCircle className="w-4 h-4 text-gray-600" />;
			default:
				return <AlertCircle className="w-4 h-4 text-gray-600" />;
		}
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container max-w-7xl mx-auto px-4 py-8">
				{/* 头部 */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								QuizGen Dashboard
							</h1>
							<p className="text-gray-600 mt-1">智能演讲互动平台</p>
						</div>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-3">
								<Avatar>
									<AvatarImage
										src={currentUser.avatar_url}
										alt={currentUser.display_name}
									/>
									<AvatarFallback>
										{currentUser.display_name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div>
									<div className="font-medium">{currentUser.display_name}</div>
									<div className="text-sm text-gray-500">
										{currentUser.email}
									</div>
								</div>
							</div>
							<Button className="flex items-center gap-2">
								<Plus className="w-4 h-4" />
								创建讲座
							</Button>
						</div>
					</div>
				</div>

				{/* 快速统计 */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-blue-100 rounded-lg">
									<Users className="w-6 h-6 text-blue-600" />
								</div>
								<div>
									<div className="text-2xl font-bold">{myLectures.length}</div>
									<div className="text-sm text-gray-600">我的讲座</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-green-100 rounded-lg">
									<Play className="w-6 h-6 text-green-600" />
								</div>
								<div>
									<div className="text-2xl font-bold">
										{myLectures.filter((l) => l.status === "active").length}
									</div>
									<div className="text-sm text-gray-600">进行中</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-purple-100 rounded-lg">
									<Calendar className="w-6 h-6 text-purple-600" />
								</div>
								<div>
									<div className="text-2xl font-bold">
										{participatedLectures.length}
									</div>
									<div className="text-sm text-gray-600">参与的讲座</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* 我的讲座 */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="w-5 h-5" />
								我的讲座
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{myLectures.map((lecture) => (
									<div
										key={lecture.id}
										className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													{getStatusIcon(lecture.status)}
													<h3 className="font-medium text-lg">
														{lecture.title}
													</h3>
													{getStatusBadge(lecture.status)}
												</div>
												<p className="text-gray-600 text-sm mb-3">
													{lecture.description}
												</p>
												<div className="flex items-center gap-4 text-sm text-gray-500">
													<div className="flex items-center gap-1">
														<Calendar className="w-4 h-4" />
														{formatDate(lecture.starts_at)}
													</div>
													<div className="flex items-center gap-1">
														<Users className="w-4 h-4" />
														{lecture.participants_count}人
													</div>
												</div>
											</div>
											<div className="flex gap-2">
												<Button variant="outline" size="sm" asChild>
													<Link href={`/lecture/${lecture.id}/speaker`}>
														演讲者视图
													</Link>
												</Button>
												{lecture.status === "active" && (
													<Button size="sm" asChild>
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
									<div className="text-center py-8 text-gray-500">
										<Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
										<p>还没有创建任何讲座</p>
										<Button className="mt-4" size="sm">
											<Plus className="w-4 h-4 mr-2" />
											创建第一个讲座
										</Button>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* 参与的讲座 */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="w-5 h-5" />
								参与的讲座
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{participatedLectures.map((lecture) => (
									<div
										key={lecture.id}
										className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
									>
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													{getStatusIcon(lecture.status)}
													<h3 className="font-medium text-lg">
														{lecture.title}
													</h3>
													{getStatusBadge(lecture.status)}
												</div>
												<div className="flex items-center gap-2 mb-3">
													<Avatar className="w-6 h-6">
														<AvatarImage
															src={lecture.owner.avatar_url}
															alt={lecture.owner.display_name}
														/>
														<AvatarFallback>
															{lecture.owner.display_name.charAt(0)}
														</AvatarFallback>
													</Avatar>
													<span className="text-sm text-gray-600">
														{lecture.owner.display_name}
													</span>
												</div>
												<div className="flex items-center gap-4 text-sm text-gray-500">
													<div className="flex items-center gap-1">
														<Calendar className="w-4 h-4" />
														{formatDate(lecture.starts_at)}
													</div>
													<div className="flex items-center gap-1">
														<Users className="w-4 h-4" />
														{lecture.participants_count}人
													</div>
												</div>
											</div>
											<div className="flex gap-2">
												{lecture.status === "active" && (
													<Button size="sm" asChild>
														<Link href={`/lecture/${lecture.id}`}>
															加入讲座
														</Link>
													</Button>
												)}
												{lecture.status === "pending" && (
													<Button variant="outline" size="sm" disabled>
														等待开始
													</Button>
												)}
											</div>
										</div>
									</div>
								))}

								{participatedLectures.length === 0 && (
									<div className="text-center py-8 text-gray-500">
										<Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
										<p>还没有参与任何讲座</p>
										<p className="text-sm mt-2">使用邀请链接加入讲座</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
