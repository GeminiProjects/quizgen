import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Calendar, Plus, Trash, Users } from 'lucide-react';
import Link from 'next/link';
import type React from 'react';

type Lecture = {
  id: string;
  title: string;
  description: string;
  status: string;
  starts_at: Date;
  participants_count: number;
  owner: { display_name: string; avatar_url?: string };
  organization?: { name: string };
};

type MyLecturesListProps = {
  lectures: Lecture[];
  onCreateLecture: () => void;
  onDeleteLecture: (id: string) => void;
  formatDate: (date: Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  getStatusIcon: (status: string) => React.ReactNode;
};

const MyLecturesList: React.FC<MyLecturesListProps> = ({
  lectures,
  onCreateLecture,
  onDeleteLecture,
  formatDate,
  getStatusBadge,
  getStatusIcon,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          我的演讲
          <Button
            className="ml-2 flex items-center gap-2"
            onClick={onCreateLecture}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            创建演讲
          </Button>
        </CardTitle>
      </CardHeader>
      <div className="h-96 overflow-y-auto">
        <CardContent>
          <div className="space-y-4">
            {lectures.map((lecture) => (
              <div
                className="rounded-lg border p-4 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
                key={lecture.id}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {getStatusIcon(lecture.status)}
                      <h3 className="font-medium text-lg">{lecture.title}</h3>
                      {getStatusBadge(lecture.status)}
                    </div>
                    <p className="mb-3 text-muted-foreground text-sm">
                      {lecture.description}
                    </p>
                    <div className="mb-2 flex items-center gap-1">
                      <Users aria-label="组织" className="h-4 w-4" />
                      <span className="text-muted-foreground text-xs">
                        {lecture.organization?.name || '默认组织'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(lecture.starts_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {lecture.participants_count}人
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/lecture/${lecture.id}/speaker`}>
                        演讲者视图
                      </Link>
                    </Button>
                    {lecture.status === 'active' && (
                      <Button asChild size="sm">
                        <Link href={`/lecture/${lecture.id}`}>进入演讲</Link>
                      </Button>
                    )}
                    <Button
                      aria-label="删除"
                      onClick={() => onDeleteLecture(lecture.id)}
                      size="sm"
                      title="删除"
                      type="button"
                      variant="outline"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {lectures.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p>还没有创建任何演讲</p>
                <Button className="mt-4" onClick={onCreateLecture} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  创建第一个演讲
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default MyLecturesList;
