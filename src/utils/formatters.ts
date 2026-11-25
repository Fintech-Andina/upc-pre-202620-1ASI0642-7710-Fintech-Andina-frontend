import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Moneda } from '@/types/api';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function currencySymbol(moneda: Moneda | string = 'PEN'): string {
  return moneda === 'USD' ? 'US$' : 'S/';
}

export function formatMoney(amount: number | undefined | null, moneda: Moneda | string = 'PEN'): string {
  const safe = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  const formatted = safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbol(moneda)} ${formatted}`;
}

export function formatPercentFromDecimal(decimal: number | undefined | null, decimals = 2): string {
  const safe = typeof decimal === 'number' && Number.isFinite(decimal) ? decimal : 0;
  return `${(safe * 100).toFixed(decimals)}%`;
}

export function formatDatePE(iso?: string | null): string {
  if (!iso) return '—';
  const clean = iso.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatSpanishDateHeader(date: Date = new Date()): string {
  const raw = date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function getInitials(name?: string | null): string {
  if (!name) return 'DB';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const BCRP_LIMITS_REF = {
  PEN: { compensatorioMaxPct: 100, moratorioMaxPct: 50 },
  USD: { compensatorioMaxPct: 80, moratorioMaxPct: 40 },
} as const;
