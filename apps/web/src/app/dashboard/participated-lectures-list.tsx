import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Calendar, Users } from 'lucide-react';
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

type ParticipatedLecturesListProps = {
  lectures: Lecture[];
  formatDate: (date: Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  getStatusIcon: (status: string) => React.ReactNode;
};

const ParticipatedLecturesList: React.FC<ParticipatedLecturesListProps> = ({
  lectures,
  formatDate,
  getStatusBadge,
  getStatusIcon,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          预约的演讲
        </CardTitle>
      </CardHeader>
      <div className="max-h-96 overflow-y-auto lg:h-96">
        <CardContent>
          <div className="space-y-4">
            {lectures.map((lecture) => (
              <div
                className="rounded-lg border p-3 transition-colors hover:bg-accent/50 sm:p-4 dark:hover:bg-accent/30"
                key={lecture.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {getStatusIcon(lecture.status)}
                      <h3 className="flex-1 font-medium text-base sm:text-lg">
                        {lecture.title}
                      </h3>
                      {getStatusBadge(lecture.status)}
                    </div>
                    <div className="mb-3 flex items-center gap-2">
                      <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                        <AvatarImage
                          alt={lecture.owner.display_name}
                          src={lecture.owner.avatar_url || ''}
                        />
                        <AvatarFallback>
                          {lecture.owner.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-xs sm:text-sm">
                        {lecture.owner.display_name}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center gap-1">
                      <Users
                        aria-label="组织"
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                      <span className="text-muted-foreground text-xs">
                        {lecture.organization?.name || '默认组织'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs sm:gap-4 sm:text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">
                          {formatDate(lecture.starts_at)}
                        </span>
                        <span className="sm:hidden">
                          {lecture.starts_at.toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        {lecture.participants_count}人
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {lecture.status === 'active' && (
                      <Button
                        asChild
                        className="flex-1 sm:flex-initial"
                        size="sm"
                      >
                        <Link href={`/lecture/${lecture.id}`}>加入</Link>
                      </Button>
                    )}
                    {lecture.status === 'pending' && (
                      <Button
                        className="flex-1 sm:flex-initial"
                        disabled
                        size="sm"
                        variant="outline"
                      >
                        等待开始
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {lectures.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p>还没有参与任何演讲</p>
                <p className="mt-2 text-sm">使用邀请链接加入演讲</p>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default ParticipatedLecturesList;
