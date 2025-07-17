import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Plus, Trash, Users } from 'lucide-react';
import type React from 'react';

type Organization = {
  id: string | number;
  name: string;
};

type CreatedOrganizationsListProps = {
  organizations: Organization[];
  onCreateOrg: () => void;
  onDeleteOrg: (id: string | number) => void;
};

const CreatedOrganizationsList: React.FC<CreatedOrganizationsListProps> = ({
  organizations,
  onCreateOrg,
  onDeleteOrg,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Users className="h-5 w-5" />
          我创建的组织
          <Button
            className="ml-2 flex items-center gap-2"
            onClick={onCreateOrg}
            size="sm"
            type="button"
          >
            <Plus className="h-4 w-4" />
            创建组织
          </Button>
        </CardTitle>
      </CardHeader>
      <div className="max-h-96 overflow-y-auto lg:h-96">
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {organizations.length > 0 ? (
              organizations.map((org) => (
                <div
                  className="flex items-center gap-3 rounded-lg border p-3 sm:p-4"
                  key={org.id}
                >
                  <Users
                    aria-label="组织"
                    className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6"
                  />
                  <span className="font-medium text-sm sm:text-base">
                    {org.name}
                  </span>
                  <Button
                    aria-label="删除"
                    onClick={() => onDeleteOrg(org.id)}
                    size="sm"
                    title="删除"
                    type="button"
                    variant="outline"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm sm:text-base">还没有创建任何组织</p>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default CreatedOrganizationsList;
