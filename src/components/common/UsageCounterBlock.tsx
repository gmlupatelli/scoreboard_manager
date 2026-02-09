'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface UsageCounterBlockProps {
  label: string;
  used: number;
  max: number;
  helperText?: string;
  warningText?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export default function UsageCounterBlock({
  label,
  used,
  max,
  helperText,
  warningText,
  ctaHref,
  ctaLabel,
}: UsageCounterBlockProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Icon
          name="InformationCircleIcon"
          size={20}
          className="text-gray-600 flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 text-sm text-gray-700">
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium">
              You have used {used} of {max} {label}.
            </p>
            {ctaHref && ctaLabel && (
              <Link
                href={ctaHref}
                className="inline-flex items-center text-orange-900 hover:bg-orange-900/10 px-2 py-1 rounded-md font-medium text-sm whitespace-nowrap transition-colors duration-150"
                title={ctaLabel}
              >
                {ctaLabel}
              </Link>
            )}
          </div>
          {helperText && <p className="text-gray-600 mt-1">{helperText}</p>}
          {warningText && <p className="text-amber-700 mt-1">{warningText}</p>}
        </div>
      </div>
    </div>
  );
}
