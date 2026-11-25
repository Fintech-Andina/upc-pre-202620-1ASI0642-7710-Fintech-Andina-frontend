import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/formatters';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'navy';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#00694d] text-white hover:bg-[#0a7a5b] shadow-sm disabled:bg-[#00694d]/50',
  navy: 'bg-[#0b3c5d] text-white hover:bg-[#082b44] shadow-sm disabled:bg-[#0b3c5d]/50',
  secondary:
    'bg-[#edf4ff] text-[#121d26] hover:bg-[#e4effd] border border-[#dce6f5]',
  outline:
    'bg-white text-[#121d26] border border-[#e6ebf0] hover:bg-[#f4f7fa]',
  ghost: 'bg-transparent text-[#3d4a43] hover:bg-[#f1f5f9]',
  danger: 'bg-[#ba1a1a] text-white hover:bg-[#93000a] shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f9d75]',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
