import type { ElementType } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ElementType;
  ctaLabel?: string;
  ctaTo?: string;
  onCtaClick?: () => void;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  ctaLabel,
  ctaTo,
  onCtaClick,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/70 px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="rounded-full bg-gray-100 p-3 text-gray-400">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {description && <p className="max-w-md text-sm text-gray-500">{description}</p>}
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="mt-2 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && !ctaTo && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="mt-2 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
