'use client';

interface SpinnerProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function Spinner({ size = 'sm', className = '' }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <svg
      data-testid="spinner"
      className={`animate-spin ${sizeClass} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PulsingDot({ className = '' }: { className?: string }) {
  return (
    <span
      data-testid="pulsing-dot"
      className={`relative flex h-2.5 w-2.5 ${className}`}
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
    </span>
  );
}

interface ActivityBannerProps {
  label: string;
  detail?: string | null;
  variant?: 'info' | 'waiting' | 'bridge';
}

const VARIANT_STYLES: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  waiting: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  bridge: 'border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100',
};

export function ActivityBanner({ label, detail, variant = 'info' }: ActivityBannerProps) {
  return (
    <div
      data-testid="activity-banner"
      className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 ${VARIANT_STYLES[variant]}`}
    >
      <Spinner size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{label}</p>
        {detail && (
          <p className="text-[11px] opacity-80 truncate">{detail}</p>
        )}
      </div>
    </div>
  );
}
