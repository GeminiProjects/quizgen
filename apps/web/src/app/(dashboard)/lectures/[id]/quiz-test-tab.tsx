'use client';

import type { Transcript } from '@repo/db';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import QuizDisplay from '@/components/quiz-display';
import type { Material } from '@/hooks/use-materials';

interface QuizTestTabProps {
  lectureId: string;
  materials?: Material[];
  transcripts?: Transcript[];
}

interface GeneratedQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

/**
 * 测试生题标签页组件
 * 用于测试基于材料和转录生成题目
 */
export default function QuizTestTab({
  lectureId,
  materials = [],
  transcripts = [],
}: QuizTestTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuizzes, setGeneratedQuizzes] = useState<GeneratedQuiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);

  /**
   * 生成测试题目
   */
  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setGeneratedQuizzes([]);
    setCurrentQuizIndex(0);
    setShowResult(false);

    try {
      // 调用后端 API 生成题目
      const response = await fetch('/api/quiz-items/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lecture_id: lectureId,
          count: 10, // 一次生成10道题
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '生成失败');
      }

      const data = await response.json();

      if (data.data.quizzes && data.data.quizzes.length > 0) {
        setGeneratedQuizzes(data.data.quizzes);
        toast.success(`成功生成 ${data.data.quizzes.length} 道题目！`);
      } else {
        throw new Error('未能生成有效的题目');
      }
    } catch (error) {
      console.error('生成题目失败:', error);
      toast.error(
        error instanceof Error ? error.message : '题目生成失败，请重试'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 处理答题
   */
  const handleAnswer = (_selectedIndex: number) => {
    // 延迟显示结果，模拟真实答题体验
    setTimeout(() => {
      setShowResult(true);
    }, 500);
  };

  /**
   * 切换到下一题
   */
  const handleNextQuiz = () => {
    if (currentQuizIndex < generatedQuizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setShowResult(false);
    }
  };

  /**
   * 切换到上一题
   */
  const handlePreviousQuiz = () => {
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex(currentQuizIndex - 1);
      setShowResult(false);
    }
  };

  /**
   * 重新生成题目
   */
  const handleRegenerate = () => {
    handleGenerateQuiz();
  };

  const hasContext = materials.length > 0 || transcripts.length > 0;

  return (
    <div className="space-y-4">
      {/* 上下文信息 */}
      <Card>
        <CardHeader>
          <CardTitle>生成上下文</CardTitle>
          <CardDescription>基于以下内容生成测验题目</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">材料上下文</h4>
              <div className="rounded-lg bg-muted/50 p-3">
                {materials.length > 0 ? (
                  <p className="text-sm">已上传 {materials.length} 份材料</p>
                ) : (
                  <p className="text-muted-foreground text-sm">暂无上传材料</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">转录文本</h4>
              <div className="rounded-lg bg-muted/50 p-3">
                {transcripts.length > 0 ? (
                  <p className="text-sm">已转录 {transcripts.length} 段文本</p>
                ) : (
                  <p className="text-muted-foreground text-sm">暂无转录内容</p>
                )}
              </div>
            </div>
          </div>

          {!hasContext && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-warning">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">
                建议先上传材料或开始演讲获取转录内容，以生成更准确的题目
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 生成按钮 */}
      {generatedQuizzes.length === 0 && (
        <div className="flex justify-center">
          <Button
            className="min-w-[200px]"
            disabled={isGenerating || !hasContext}
            onClick={handleGenerateQuiz}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                生成测试题目
              </>
            )}
          </Button>
        </div>
      )}

      {/* 题目展示 */}
      {generatedQuizzes.length > 0 && generatedQuizzes[currentQuizIndex] && (
        <div className="space-y-4">
          {/* 题目进度 */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
            <span className="text-muted-foreground text-sm">
              第 {currentQuizIndex + 1} 题 / 共 {generatedQuizzes.length} 题
            </span>
            {generatedQuizzes[currentQuizIndex].explanation && showResult && (
              <span className="text-muted-foreground text-xs">
                包含答案解释
              </span>
            )}
          </div>

          <QuizDisplay
            correctAnswer={generatedQuizzes[currentQuizIndex].correctAnswer}
            onAnswer={handleAnswer}
            options={generatedQuizzes[currentQuizIndex].options}
            question={generatedQuizzes[currentQuizIndex].question}
            showResult={showResult}
            timeLimit={600}
          />

          {/* 答案解释 */}
          {showResult && generatedQuizzes[currentQuizIndex].explanation && (
            <Card className="border-info/20 bg-info/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-info" />
                  <div className="space-y-1">
                    <p className="font-medium text-info text-sm">答案解释</p>
                    <p className="text-muted-foreground text-sm">
                      {generatedQuizzes[currentQuizIndex].explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-center gap-3">
            <Button
              disabled={currentQuizIndex === 0}
              onClick={handlePreviousQuiz}
              variant="outline"
            >
              上一题
            </Button>
            {currentQuizIndex < generatedQuizzes.length - 1 ? (
              <Button onClick={handleNextQuiz}>下一题</Button>
            ) : (
              <Button onClick={handleRegenerate}>重新生成</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
