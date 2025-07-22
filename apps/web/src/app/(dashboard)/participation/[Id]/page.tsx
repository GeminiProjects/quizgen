import { notFound } from 'next/navigation';
import { getParticipatedLectureWithQuizzes } from '@/app/actions/participation';

interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function ParticipationLecturePage({ params }: PageProps) {
  try {
    const { id } = await params;
    const lecture = await getParticipatedLectureWithQuizzes(id);

    const Content = (await import('./content')).default;
    return <Content lecture={lecture} />;
  } catch (error) {
    if ((error as Error).message.includes('未参与')) {
      return (
        <div className="container mx-auto max-w-4xl py-8 text-center">
          <h1 className="mb-4 font-bold text-2xl">您未参与该演讲</h1>
          <p className="text-muted-foreground">
            请使用演讲码加入演讲后再访问此页面
          </p>
        </div>
      );
    }
    notFound();
  }
}
