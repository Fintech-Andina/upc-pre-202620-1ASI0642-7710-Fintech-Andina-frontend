import React, { createContext, useContext, useState } from 'react';
import type { Moneda } from '@/types/api';

export type CurrencyFilter = 'ALL' | Moneda;

interface CurrencyContextValue {
  currencyFilter: CurrencyFilter;
  setCurrencyFilter: (value: CurrencyFilter) => void;
  displayCurrency: Moneda;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('ALL');

  const displayCurrency: Moneda = currencyFilter === 'USD' ? 'USD' : 'PEN';

  return (
    <CurrencyContext.Provider value={{ currencyFilter, setCurrencyFilter, displayCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency debe usarse dentro de CurrencyProvider');
  }
  return ctx;
}
