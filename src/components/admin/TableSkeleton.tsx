interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export default function TableSkeleton({
  columns = 6,
  rows = 6,
  className = '',
}: TableSkeletonProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}>
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-3 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className="h-3 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

