'use client';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface JoinCodeFieldProps {
  lectureId: string;
  joinCode: string;
}

export default function JoinCodeField({ joinCode }: JoinCodeFieldProps) {
  const [showJoinCode, setShowJoinCode] = useState(false);

  const copyJoinCode = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(joinCode);
      toast.success('加入码已复制');
    } catch (_error) {
      toast.error('复制失败');
    }
  };

  return (
    <div className="relative z-20 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Input
          className="h-8 pr-20 font-mono text-xs"
          onClick={(e) => e.stopPropagation()}
          readOnly
          type={showJoinCode ? 'text' : 'password'}
          value={joinCode}
        />
      </div>
      <div className="absolute top-1 right-1 flex gap-1">
        <Button
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowJoinCode(!showJoinCode);
          }}
          size="sm"
          variant="ghost"
        >
          {showJoinCode ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
        <Button
          className="h-6 w-6 p-0"
          onClick={copyJoinCode}
          size="sm"
          variant="ghost"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
