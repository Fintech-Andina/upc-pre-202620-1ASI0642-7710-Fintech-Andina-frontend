import React from 'react';
import { cn } from '@/utils/formatters';

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#e6ebf0] bg-white shadow-[0_4px_10px_rgba(15,60,93,0.04)]',
        className
      )}
    >
      {children}
    </div>
  );
}

type BadgeVariant = 'emerald' | 'amber' | 'red' | 'navy' | 'slate';

const badgeVariants: Record<BadgeVariant, string> = {
  emerald: 'bg-[#ecfdf5] text-[#00694d] border-[#a7f3d0]/80',
  amber: 'bg-[#fffbeb] text-[#805200] border-[#fde68a]',
  red: 'bg-[#fef2f2] text-[#ba1a1a] border-[#fecaca]',
  navy: 'bg-[#f0f6fa] text-[#0b3c5d] border-[#dbe8f2]',
  slate: 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]',
};

export function Badge({
  variant = 'slate',
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
