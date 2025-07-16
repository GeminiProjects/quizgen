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
import React, { useState } from "react";

export default function Dashboard() {
	const currentUser = getCurrentUser();
	const myLectures = getUserLectures(currentUser.id).map(l => ({ ...l, organization: { name: "默认组织" } }));
	const participatedLectures = getUserParticipatedLectures(currentUser.id).map(l => ({ ...l, organization: { name: "默认组织" } }));
	const myOrganizations = [{ id: 1, name: "默认组织" }]; // mock 组织数据

	const [showCreateLectureModal, setShowCreateLectureModal] = useState(false);
	const [lectureTitle, setLectureTitle] = useState("");
	const [lectureDesc, setLectureDesc] = useState("");
	const [lectureType, setLectureType] = useState<"personal" | "org">("personal");
	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
	const [orgPassword, setOrgPassword] = useState("");
	const [errorMsg, setErrorMsg] = useState("");

	// mock 密码校验
	const checkOrgPassword = (orgId: string, password: string) => {
		// 假设所有组织密码都是 "123456"
		return password === "123456";
	};

	const handleCreateLecture = () => {
		setErrorMsg("");
		if (!lectureTitle.trim()) {
			setErrorMsg("讲座标题不能为空");
			return;
		}
		if (lectureType === "org") {
			if (!selectedOrgId) {
				setErrorMsg("请选择组织");
				return;
			}
			if (!orgPassword) {
				setErrorMsg("请输入组织密码");
				return;
			}
			if (!checkOrgPassword(selectedOrgId, orgPassword)) {
				setErrorMsg("组织密码错误");
				return;
			}
		}
		// mock 新讲座
		const newLecture = {
			id: Date.now().toString(),
			title: lectureTitle,
			description: lectureDesc,
			status: "pending",
			starts_at: new Date(),
			participants_count: 0,
			owner: currentUser,
			organization: lectureType === "org" ? myOrganizations.find(o => o.id.toString() === selectedOrgId) : undefined,
			org_id: lectureType === "org" ? selectedOrgId : null,
		};
		// 这里只是演示，实际应 setState 或调用后端
		alert(`讲座已创建: ${JSON.stringify(newLecture, null, 2)}`);
		setShowCreateLectureModal(false);
		setLectureTitle("");
		setLectureDesc("");
		setLectureType("personal");
		setSelectedOrgId(null);
		setOrgPassword("");
	};

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
							<Button className="flex items-center gap-2" onClick={() => setShowCreateLectureModal(true)}>
								<Plus className="w-4 h-4" />
								创建讲座
							</Button>
						</div>
					</div>
				</div>

				{/* 快速统计 */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

					{/* 新增组织卡片 */}
					<Card>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 bg-yellow-100 rounded-lg">
									<Users className="w-6 h-6 text-yellow-600" aria-label="组织" />
								</div>
								<div>
									<div className="text-2xl font-bold">{myOrganizations.length}</div>
									<div className="text-sm text-gray-600">组织</div>
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
						<div className="h-96 overflow-y-auto">
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
													{/* 所属组织 */}
													<div className="flex items-center gap-1 mb-2">
														<Users className="w-4 h-4" aria-label="组织" />
														<span className="text-xs text-gray-500">{lecture.organization?.name || "默认组织"}</span>
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
						</div>
					</Card>

					{/* 参与的讲座 */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="w-5 h-5" />
								参与的讲座
							</CardTitle>
						</CardHeader>
						<div className="h-96 overflow-y-auto">
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
													{/* 所属组织 */}
													<div className="flex items-center gap-1 mb-2">
														<Users className="w-4 h-4" aria-label="组织" />
														<span className="text-xs text-gray-500">{lecture.organization?.name || "默认组织"}</span>
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
						</div>
					</Card>
				</div>

				{/* 我的组织 */}
				<Card className="mt-8">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="w-5 h-5" />
							我的组织
						</CardTitle>
					</CardHeader>
					<div className="h-96 overflow-y-auto">
						<CardContent>
							<div className="space-y-4">
								{myOrganizations.length > 0 ? (
									myOrganizations.map(org => (
										<div key={org.id} className="flex items-center gap-3 p-4 border rounded-lg">
											<Users className="w-6 h-6 text-yellow-600" aria-label="组织" />
											<span className="font-medium">{org.name}</span>
										</div>
									))
								) : (
									<div className="text-center text-gray-500 py-8">
										<Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
										<p>还没有加入任何组织</p>
									</div>
								)}
							</div>
						</CardContent>
					</div>
				</Card>
			</div>

			{showCreateLectureModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
						<button
							className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
							aria-label="关闭"
							onClick={() => setShowCreateLectureModal(false)}
						>
							×
						</button>
						<h2 className="text-xl font-bold mb-4">创建讲座</h2>
						<div className="mb-3">
							<label className="block text-sm font-medium mb-1">讲座标题</label>
							<input
								className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
								value={lectureTitle}
								onChange={e => setLectureTitle(e.target.value)}
								placeholder="请输入讲座标题"
							/>
						</div>
						<div className="mb-3">
							<label className="block text-sm font-medium mb-1">讲座描述</label>
							<textarea
								className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
								value={lectureDesc}
								onChange={e => setLectureDesc(e.target.value)}
								placeholder="请输入讲座描述"
							/>
						</div>
						<div className="mb-3">
							<label className="block text-sm font-medium mb-1">讲座类型</label>
							<div className="flex gap-4">
								<label className="flex items-center gap-1">
									<input
										type="radio"
										name="lectureType"
										value="personal"
										checked={lectureType === "personal"}
										onChange={() => setLectureType("personal")}
									/>
									个人讲座
								</label>
								<label className="flex items-center gap-1">
									<input
										type="radio"
										name="lectureType"
										value="org"
										checked={lectureType === "org"}
										onChange={() => setLectureType("org")}
									/>
									加入组织
								</label>
							</div>
						</div>
						{lectureType === "org" && (
							<>
								<div className="mb-3">
									<label className="block text-sm font-medium mb-1">选择组织</label>
									<select
										className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
										value={selectedOrgId || ""}
										onChange={e => setSelectedOrgId(e.target.value)}
									>
										<option value="">请选择组织</option>
										{myOrganizations.map(org => (
											<option key={org.id} value={org.id}>{org.name}</option>
										))}
									</select>
								</div>
								<div className="mb-3">
									<label className="block text-sm font-medium mb-1">组织密码</label>
									<input
										type="password"
										className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
										value={orgPassword}
										onChange={e => setOrgPassword(e.target.value)}
										placeholder="请输入组织密码"
									/>
								</div>
							</>
						)}
						{errorMsg && <div className="text-red-500 text-sm mb-2">{errorMsg}</div>}
						<Button className="w-full mt-2" onClick={handleCreateLecture}>
							创建
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
