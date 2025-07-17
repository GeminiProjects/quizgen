import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Users, Trash } from 'lucide-react';

type Organization = {
  id: string | number;
  name: string;
};

type JoinedOrganizationsListProps = {
  organizations: Organization[];
  onDeleteOrg: (id: string | number) => void;
};

const JoinedOrganizationsList: React.FC<JoinedOrganizationsListProps> = ({
  organizations,
  onDeleteOrg,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Users className="h-5 w-5" />
          我加入的组织
        </CardTitle>
      </CardHeader>
      <div className="max-h-96 overflow-y-auto lg:h-96">
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {organizations.length > 0 ? (
              organizations.map((org) => (
                <div className="flex items-center gap-3 rounded-lg border p-3 sm:p-4" key={org.id}>
                  <Users aria-label="组织" className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6" />
                  <span className="font-medium text-sm sm:text-base">{org.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    title="删除"
                    aria-label="删除"
                    type="button"
                    onClick={() => onDeleteOrg(org.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm sm:text-base">还没有加入任何组织</p>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default JoinedOrganizationsList; 