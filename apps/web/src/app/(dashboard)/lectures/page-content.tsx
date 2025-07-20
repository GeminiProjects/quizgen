'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Plus, Presentation } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import CreateLectureDialog from './create-lecture-dialog';

interface PageContentProps {
  hasLectures: boolean;
}

export default function LecturesPageContent({ hasLectures }: PageContentProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleLectureCreated = () => {
    setShowCreateDialog(false);
    toast.success('演讲创建成功');
  };

  if (!hasLectures) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Presentation className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">还没有创建任何演讲</h3>
            <p className="mb-4 text-center text-muted-foreground">
              创建您的第一场演讲，开始智能测验之旅！
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建演讲
            </Button>
          </CardContent>
        </Card>

        <CreateLectureDialog
          onOpenChange={setShowCreateDialog}
          onSuccess={handleLectureCreated}
          open={showCreateDialog}
        />
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        创建演讲
      </Button>

      <CreateLectureDialog
        onOpenChange={setShowCreateDialog}
        onSuccess={handleLectureCreated}
        open={showCreateDialog}
      />
    </>
  );
}
