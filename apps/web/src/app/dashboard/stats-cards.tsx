import React from 'react';
import { Card, CardContent } from '@repo/ui/components/card';
import { Users, Play, Calendar } from 'lucide-react';

type StatsCardsProps = {
  myLecturesCount: number;
  activeLecturesCount: number;
  participatedLecturesCount: number;
  myOrganizationsCount: number;
};

const StatsCards: React.FC<StatsCardsProps> = ({
  myLecturesCount,
  activeLecturesCount,
  participatedLecturesCount,
  myOrganizationsCount,
}) => {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-bold text-2xl">{myLecturesCount}</div>
              <div className="text-muted-foreground text-sm">我的演讲</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-500/10 p-3">
              <Play className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="font-bold text-2xl">{activeLecturesCount}</div>
              <div className="text-muted-foreground text-sm">进行中</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <div className="font-bold text-2xl">{participatedLecturesCount}</div>
              <div className="text-muted-foreground text-sm">参与的演讲</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-yellow-500/10 p-3">
              <Users aria-label="组织" className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <div className="font-bold text-2xl">{myOrganizationsCount}</div>
              <div className="text-muted-foreground text-sm">组织</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards; 