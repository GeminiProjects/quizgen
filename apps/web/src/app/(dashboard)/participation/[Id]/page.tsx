import { notFound } from 'next/navigation';
import { getLectureWithQuizzes } from '@/app/actions/lectures';

// 定义页面参数接口
interface PageParams {
  params: {
    Id: string;
  };
}

export default async function ParticipationLecturePage({ params }: PageParams) {
  const lectureId = params.Id;
  const {
    success,
    data,
    message = '未知错误',
  } = await getLectureWithQuizzes(lectureId);

  if (!success) {
    // 根据错误信息判断是否为 404
    if (message.includes('not found')) {
      notFound();
    }
    // 其他错误可以显示错误信息或重定向
    return (
      <div className="container mx-auto max-w-4xl py-8 text-center text-destructive">
        <p>加载失败：{message}</p>
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  // 动态导入 Content 组件
  const Content = (await import('./content')).default;
  return <Content lecture={data} />;
}
