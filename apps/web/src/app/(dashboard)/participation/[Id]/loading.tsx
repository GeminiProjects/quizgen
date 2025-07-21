import { Skeleton } from '@repo/ui/components/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-4">
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
