import type {
    Attempt,
    Lecture,
    LectureStats,
    QuizItem,
    QuizStats,
    User,
} from "@/types";

// Mock 用户数据
export const mockUsers: User[] = [
    {
        id: "user-1",
        display_name: "张教授",
        email: "zhang@university.edu",
        avatar_url: "https://avatar.vercel.sh/zhang",
        created_at: new Date("2024-01-01"),
    },
    {
        id: "user-2",
        display_name: "李博士",
        email: "li@company.com",
        avatar_url: "https://avatar.vercel.sh/li",
        created_at: new Date("2024-01-02"),
    },
    {
        id: "user-3",
        display_name: "王同学",
        email: "wang@student.edu",
        avatar_url: "https://avatar.vercel.sh/wang",
        created_at: new Date("2024-01-03"),
    },
    {
        id: "user-4",
        display_name: "刘工程师",
        email: "liu@tech.com",
        avatar_url: "https://avatar.vercel.sh/liu",
        created_at: new Date("2024-01-04"),
    },
    {
        id: "user-5",
        display_name: "陈研究员",
        email: "chen@research.org",
        avatar_url: "https://avatar.vercel.sh/chen",
        created_at: new Date("2024-01-05"),
    },
];

// Mock 讲座数据
export const mockLectures: Lecture[] = [
    {
        id: "lecture-1",
        title: "深度学习基础与应用",
        description: "介绍深度学习的基本概念、神经网络架构以及实际应用案例",
        owner_id: "user-1",
        owner: mockUsers[0],
        starts_at: new Date("2024-12-20T14:00:00"),
        ends_at: new Date("2024-12-20T16:00:00"),
        status: "active",
        participants_count: 45,
        created_at: new Date("2024-12-15"),
    },
    {
        id: "lecture-2",
        title: "前端开发最佳实践",
        description: "分享现代前端开发的技术栈选择和最佳实践经验",
        owner_id: "user-2",
        owner: mockUsers[1],
        starts_at: new Date("2024-12-21T09:00:00"),
        ends_at: new Date("2024-12-21T11:00:00"),
        status: "pending",
        participants_count: 32,
        created_at: new Date("2024-12-16"),
    },
    {
        id: "lecture-3",
        title: "人工智能伦理思考",
        description: "探讨人工智能技术发展中的伦理问题和社会责任",
        owner_id: "user-1",
        owner: mockUsers[0],
        starts_at: new Date("2024-12-18T10:00:00"),
        ends_at: new Date("2024-12-18T12:00:00"),
        status: "completed",
        participants_count: 67,
        created_at: new Date("2024-12-10"),
    },
    {
        id: "lecture-4",
        title: "计算机技术原理",
        description: "从技术角度深入理解计算机的工作原理和应用场景",
        owner_id: "user-5",
        owner: mockUsers[4],
        starts_at: new Date("2024-12-22T15:00:00"),
        ends_at: new Date("2024-12-22T17:00:00"),
        status: "pending",
        participants_count: 28,
        created_at: new Date("2024-12-17"),
    },
];

// Mock 题目数据
export const mockQuizItems: QuizItem[] = [
    {
        id: "quiz-1",
        lecture_id: "lecture-1",
        question: "以下哪个不是深度学习的主要特点？",
        options: [
            "自动特征提取",
            "需要大量标注数据",
            "多层神经网络结构",
            "完全不需要人工干预",
        ],
        answer: 3,
        ts: new Date("2024-12-20T14:15:00"),
        time_limit: 30,
        is_active: true,
        created_at: new Date("2024-12-20T14:15:00"),
    },
    {
        id: "quiz-2",
        lecture_id: "lecture-1",
        question: "卷积神经网络 (CNN) 最适用于哪种类型的数据？",
        options: ["时间序列数据", "图像数据", "文本数据", "语音数据"],
        answer: 1,
        ts: new Date("2024-12-20T14:30:00"),
        time_limit: 30,
        is_active: false,
        created_at: new Date("2024-12-20T14:30:00"),
    },
    {
        id: "quiz-3",
        lecture_id: "lecture-2",
        question: "React 18 引入的新特性中，哪个用于提高应用性能？",
        options: [
            "Suspense",
            "Concurrent Features",
            "Strict Mode",
            "Error Boundaries",
        ],
        answer: 1,
        ts: new Date("2024-12-21T09:20:00"),
        time_limit: 30,
        is_active: false,
        created_at: new Date("2024-12-21T09:20:00"),
    },
];

// Mock 答题记录数据
export const mockAttempts: Attempt[] = [
    {
        quiz_id: "quiz-1",
        user_id: "user-3",
        user: mockUsers[2],
        selected: 3,
        is_correct: true,
        latency_ms: 12500,
        answered_at: new Date("2024-12-20T14:15:15"),
    },
    {
        quiz_id: "quiz-1",
        user_id: "user-4",
        user: mockUsers[3],
        selected: 1,
        is_correct: false,
        latency_ms: 18200,
        answered_at: new Date("2024-12-20T14:15:20"),
    },
    {
        quiz_id: "quiz-1",
        user_id: "user-5",
        user: mockUsers[4],
        selected: 3,
        is_correct: true,
        latency_ms: 9800,
        answered_at: new Date("2024-12-20T14:15:12"),
    },
    {
        quiz_id: "quiz-2",
        user_id: "user-3",
        user: mockUsers[2],
        selected: 1,
        is_correct: true,
        latency_ms: 8500,
        answered_at: new Date("2024-12-20T14:30:10"),
    },
    {
        quiz_id: "quiz-2",
        user_id: "user-4",
        user: mockUsers[3],
        selected: 1,
        is_correct: true,
        latency_ms: 15300,
        answered_at: new Date("2024-12-20T14:30:18"),
    },
];

// Mock 题目统计数据
export const mockQuizStats: QuizStats[] = [
    {
        quiz_id: "quiz-1",
        total_attempts: 35,
        correct_attempts: 28,
        accuracy_rate: 0.8,
        average_latency: 13400,
        option_distribution: [3, 7, 5, 20], // 选项A: 3人, B: 7人, C: 5人, D: 20人
    },
    {
        quiz_id: "quiz-2",
        total_attempts: 32,
        correct_attempts: 29,
        accuracy_rate: 0.906,
        average_latency: 11200,
        option_distribution: [1, 29, 1, 1],
    },
    {
        quiz_id: "quiz-3",
        total_attempts: 28,
        correct_attempts: 25,
        accuracy_rate: 0.893,
        average_latency: 14800,
        option_distribution: [2, 25, 0, 1],
    },
];

// Mock 讲座统计数据
export const mockLectureStats: LectureStats[] = [
    {
        lecture_id: "lecture-1",
        total_participants: 45,
        total_questions: 2,
        overall_accuracy: 0.843,
        engagement_rate: 0.756,
        quiz_stats: mockQuizStats.slice(0, 2),
    },
    {
        lecture_id: "lecture-2",
        total_participants: 32,
        total_questions: 1,
        overall_accuracy: 0.893,
        engagement_rate: 0.875,
        quiz_stats: mockQuizStats.slice(2, 3),
    },
];

// 获取当前用户（模拟登录用户）
export const getCurrentUser = (): User => mockUsers[0];

// 获取用户的讲座列表
export const getUserLectures = (userId: string): Lecture[] => {
    return mockLectures.filter((lecture) => lecture.owner_id === userId);
};

// 获取用户参与的讲座列表
export const getUserParticipatedLectures = (userId: string): Lecture[] => {
    // 简化处理，返回非本人创建的讲座
    return mockLectures.filter((lecture) => lecture.owner_id !== userId);
};

// 获取讲座详情
export const getLectureById = (lectureId: string): Lecture | null => {
    return mockLectures.find((lecture) => lecture.id === lectureId) || null;
};

// 获取讲座的当前活跃题目
export const getActiveLectureQuiz = (lectureId: string): QuizItem | null => {
    return (
        mockQuizItems.find(
            (quiz) => quiz.lecture_id === lectureId && quiz.is_active,
        ) || null
    );
};

// 获取讲座的所有题目
export const getLectureQuizzes = (lectureId: string): QuizItem[] => {
    return mockQuizItems.filter((quiz) => quiz.lecture_id === lectureId);
};

// 获取题目统计
export const getQuizStats = (quizId: string): QuizStats | null => {
    return mockQuizStats.find((stats) => stats.quiz_id === quizId) || null;
};

// 获取讲座统计
export const getLectureStats = (lectureId: string): LectureStats | null => {
    return (
        mockLectureStats.find((stats) => stats.lecture_id === lectureId) || null
    );
};

// 获取用户的答题记录
export const getUserAttempts = (userId: string): Attempt[] => {
    return mockAttempts.filter((attempt) => attempt.user_id === userId);
};

// 获取题目的答题记录
export const getQuizAttempts = (quizId: string): Attempt[] => {
    return mockAttempts.filter((attempt) => attempt.quiz_id === quizId);
};
