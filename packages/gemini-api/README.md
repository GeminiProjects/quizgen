```
 import { FileUpload } from '@/components/materials/file-upload';
  import { MaterialList } from '@/components/materials/material-list';
  import { MaterialContentDialog } from '@/components/materials/material-content-dialog';
  import { refreshMaterials } from '@/hooks/use-materials';

  function LectureEditPage({ lectureId }: { lectureId: string }) {
    const [viewMaterialId, setViewMaterialId] = useState<string | null>(null);

    return (
      <Tabs>
        <TabsList>
          <TabsTrigger value="materials">演讲材料</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <div className="space-y-6">
            <FileUpload
              lectureId={lectureId}
              onUploadComplete={() => refreshMaterials(lectureId)}
            />

            <MaterialList
              lectureId={lectureId}
              onViewContent={setViewMaterialId}
            />

            <MaterialContentDialog
              materialId={viewMaterialId}
              open={!!viewMaterialId}
              onOpenChange={(open) => !open && setViewMaterialId(null)}
            />
          </div>
        </TabsContent>
      </Tabs>
    );
  }
```