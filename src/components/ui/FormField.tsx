import React from 'react';
import { FieldHelpTooltip } from '@/components/help/FieldHelpTooltip';
import { cn } from '@/utils/formatters';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  helpKey: string;
  required?: boolean;
  error?: string;
  hint?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  helpKey,
  required,
  error,
  hint,
  rightSlot,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={htmlFor}
            className="text-xs font-semibold tracking-tight text-[#121d26]"
          >
            {label}
            {required && <span className="ml-0.5 text-[#ba1a1a]">*</span>}
          </label>
          <FieldHelpTooltip helpKey={helpKey} />
        </div>
        {rightSlot}
      </div>
      {children}
      {hint && !error && <p className="text-[11px] text-[#64748b]">{hint}</p>}
      {error && <p className="text-[11.5px] font-medium text-[#ba1a1a]">{error}</p>}
    </div>
  );
}

export const inputBaseClass =
  'w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5 text-sm text-[#121d26] shadow-2xs transition-colors placeholder:text-[#94a3b8] focus:border-[#0f9d75] focus:outline-none focus:ring-2 focus:ring-[#0f9d75]/15 disabled:bg-[#f1f5f9] disabled:text-[#64748b]';
