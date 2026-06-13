export const ProductSkeleton = () => (
  <div className="animate-pulse bg-card rounded-lg overflow-hidden border">
    <div className="aspect-square bg-muted" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 bg-muted rounded w-1/4" />
        <div className="h-8 bg-muted rounded w-8" />
      </div>
    </div>
  </div>
);
