'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { Building2, Plus } from 'lucide-react';
import { useState } from 'react';
import CreateOrganizationDialog from './create-org-dialog';

interface PageContentProps {
  hasOrganizations: boolean;
  searchQuery?: string;
}

export default function OrganizationsPageContent({
  hasOrganizations,
  searchQuery,
}: PageContentProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (!(hasOrganizations || searchQuery)) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">还没有创建任何组织</h3>
            <p className="mb-4 text-center text-muted-foreground">
              创建您的第一个组织，开始管理系列演讲活动！
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建组织
            </Button>
          </CardContent>
        </Card>

        <CreateOrganizationDialog
          onOpenChange={setShowCreateDialog}
          onSuccess={() => setShowCreateDialog(false)}
          open={showCreateDialog}
        />
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setShowCreateDialog(true)}>
        <Plus className="mr-2 h-4 w-4" />
        创建组织
      </Button>

      <CreateOrganizationDialog
        onOpenChange={setShowCreateDialog}
        onSuccess={() => setShowCreateDialog(false)}
        open={showCreateDialog}
      />
    </>
  );
}
