import { Skeleton, SkeletonCards } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-3 h-8 w-64" />
      <Skeleton className="mb-8 h-4 w-96" />
      <SkeletonCards />
    </div>
  );
}
