'use client';

interface BridgeRequiredBannerProps {
  bridgeConnected: boolean;
}

export function BridgeRequiredBanner({ bridgeConnected }: BridgeRequiredBannerProps) {
  if (bridgeConnected) {
    return null;
  }

  return (
    <div
      data-testid="bridge-required-banner"
      className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
    >
      <p className="text-sm font-medium text-red-900 dark:text-red-100">
        Bridge Required
      </p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
        This skill requires the OS Loop Bridge. Install and connect it before continuing.
      </p>
    </div>
  );
}
