interface FredLoadingSkeletonProps {
  variant: "sparkline" | "value" | "table" | "card";
}

export default function FredLoadingSkeleton({ variant }: FredLoadingSkeletonProps) {
  if (variant === "value") {
    return (
      <span className="inline-block w-16 h-4 bg-fred-gray-200 rounded animate-pulse" />
    );
  }

  if (variant === "sparkline") {
    return (
      <div className="w-full h-12 bg-fred-gray-200 rounded animate-pulse" />
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <span className="w-20 h-4 bg-fred-gray-200 rounded animate-pulse" />
            <span className="w-16 h-4 bg-fred-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // card
  return (
    <div className="space-y-3">
      <div className="w-24 h-6 bg-fred-gray-200 rounded animate-pulse" />
      <div className="w-40 h-3 bg-fred-gray-200 rounded animate-pulse" />
      <div className="w-full h-12 bg-fred-gray-200 rounded animate-pulse" />
      <div className="w-32 h-3 bg-fred-gray-200 rounded animate-pulse" />
    </div>
  );
}
