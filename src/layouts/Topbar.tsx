import { Bell, Calendar, HelpCircle, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency, type CurrencyFilter } from '@/context/CurrencyContext';
import { cn, formatSpanishDateHeader, getInitials } from '@/utils/formatters';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenHelp: () => void;
  overdueCount?: number;
  onClickAlerts?: () => void;
}

export function Topbar({
  onOpenMobileMenu,
  onOpenHelp,
  overdueCount = 0,
  onClickAlerts,
}: TopbarProps) {
  const { rol, user, tienda, cliente } = useAuth();
  const { currencyFilter, setCurrencyFilter } = useCurrency();

  const statusText =
    rol === 'ADMIN_SISTEMA'
      ? 'Superadmin: Fintech Andina'
      : rol === 'CLIENTE'
      ? 'Portal del Vecino · Solo Consulta'
      : 'Caja activa: Principal';

  const displayName =
    rol === 'CLIENTE'
      ? cliente?.nombreCompleto || user?.nombre || 'Vecino'
      : tienda?.nombreComercial || tienda?.nombre || user?.nombre || 'Admin';

  const options: Array<{ value: CurrencyFilter; label: string }> = [
    { value: 'ALL', label: 'Todas' },
    { value: 'PEN', label: 'S/ Soles' },
    { value: 'USD', label: 'US$ Dólares' },
  ];

  return (
    <header className="no-print sticky top-0 z-20 flex h-[72px] w-full items-center justify-between gap-4 border-b border-[#e6ebf0] bg-white px-4 sm:px-8 shadow-[0_1px_2px_rgba(15,60,93,0.03)]">
      {/* Left: Mobile Menu + Date + Status */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú lateral"
          className="lg:hidden rounded-xl border border-[#e6ebf0] bg-[#f8fafc] p-2 text-[#121d26] hover:bg-[#f1f5f9]"
        >
          <Menu className="size-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-[13px] font-medium text-[#64748b]">
          <Calendar className="size-4 text-[#64748b]" />
          <span>{formatSpanishDateHeader()}</span>
        </div>

        <span className="hidden sm:inline text-[#cbd5e1]">|</span>

        <div className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0]/80 bg-[#f1f5f9] px-3 py-1.5 text-xs font-medium text-[#334155]">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14b886] opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-[#0f9d75]" />
          </span>
          <span className="truncate">{statusText}</span>
        </div>
      </div>

      {/* Right: Currency Toggle + Notifications + Help + Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {rol !== 'ADMIN_SISTEMA' && (
          <div
            role="group"
            aria-label="Filtro visual de moneda"
            className="hidden md:flex items-center rounded-lg border border-[#e2e8f0]/80 bg-[#f1f5f9] p-1"
          >
            {options.map((opt) => {
              const active = currencyFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCurrencyFilter(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-all cursor-pointer',
                    active
                      ? 'bg-white font-semibold text-[#0b3c5d] shadow-2xs'
                      : 'font-medium text-[#64748b] hover:text-[#121d26]'
                  )}
                >
                  {active && <span className="size-1.5 rounded-full bg-[#0f9d75]" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {rol === 'ADMIN_NEGOCIO' && (
          <button
            type="button"
            onClick={onClickAlerts}
            aria-label={`Alertas de mora (${overdueCount})`}
            title="Ver créditos y alertas de cobranza"
            className="relative flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9]/80 text-[#334155] transition-colors hover:bg-[#e4effd] cursor-pointer"
          >
            <Bell className="size-4" />
            {overdueCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f59e0b] px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {overdueCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Abrir Centro de Ayuda y Asistencia Técnica"
          title="Centro de Ayuda y Glosario Financiero"
          className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f1f5f9]/80 text-[#0b3c5d] transition-colors hover:bg-[#e4effd] hover:text-[#00694d] cursor-pointer"
        >
          <HelpCircle className="size-4.5" />
        </button>

        <div
          title={displayName}
          className="flex size-9 items-center justify-center rounded-full bg-[#00694d] text-xs font-bold text-white ring-2 ring-white shadow-[0_0_0_2px_rgba(15,157,117,0.3)]"
        >
          {getInitials(displayName)}
        </div>
      </div>
    </header>
  );
}
