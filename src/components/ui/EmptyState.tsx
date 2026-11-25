import React from 'react';
import { cn } from '@/utils/formatters';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd5e1] bg-white/70 px-6 py-12 text-center',
        className
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#0b3c5d]">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#121d26]">{title}</h3>
      <p className="mt-1 max-w-md text-xs sm:text-sm text-[#64748b]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageLoader({ label = 'Cargando información...' }: { label?: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-sm text-[#64748b]">
      <div className="size-8 animate-spin rounded-full border-3 border-[#e2e8f0] border-t-[#0f9d75]" />
      <p>{label}</p>
    </div>
  );
}
