import type { ReactNode } from 'react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  children: ReactNode;
}

export default function BulkActionBar({ selectedCount, onClear, children }: BulkActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(980px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-blue-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-medium text-blue-700">{selectedCount} selected</span>
        <button
          type="button"
          onClick={onClear}
          className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
}
