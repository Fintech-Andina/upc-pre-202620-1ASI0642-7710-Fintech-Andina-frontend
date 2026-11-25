import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  Scale,
  Settings,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn, getInitials } from '@/utils/formatters';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  isCta?: boolean;
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { rol, user, tienda, cliente, logout } = useAuth();
  const navigate = useNavigate();

  const merchantNav: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="size-4" /> },
    { label: 'Clientes', to: '/clientes', icon: <Users className="size-4" /> },
    { label: 'Productos', to: '/productos', icon: <Package className="size-4" /> },
    { label: 'Reglas de financiamiento', to: '/reglas', icon: <Scale className="size-4" /> },
    {
      label: 'Nuevo crédito',
      to: '/creditos/nuevo',
      icon: <PlusCircle className="size-4" />,
      isCta: true,
    },
    { label: 'Créditos', to: '/creditos', icon: <CreditCard className="size-4" /> },
    { label: 'Reportes', to: '/reportes', icon: <BarChart3 className="size-4" /> },
    { label: 'Configuración', to: '/configuracion', icon: <Settings className="size-4" /> },
  ];

  const adminNav: NavItem[] = [
    { label: 'Gestión de Tiendas', to: '/admin/tiendas', icon: <Building2 className="size-4" /> },
    { label: 'Estado del Sistema', to: '/admin/salud', icon: <Activity className="size-4" /> },
  ];

  const clientNav: NavItem[] = [
    { label: 'Mi Línea y Resumen', to: '/mi-cuenta', icon: <Wallet className="size-4" /> },
    {
      label: 'Estado de Cuenta',
      to: '/mi-cuenta/estado-cuenta',
      icon: <FileText className="size-4" />,
    },
    { label: 'Mis Créditos', to: '/mi-cuenta/creditos', icon: <CreditCard className="size-4" /> },
  ];

  const navItems =
    rol === 'ADMIN_SISTEMA' ? adminNav : rol === 'CLIENTE' ? clientNav : merchantNav;

  const displayName =
    rol === 'CLIENTE'
      ? cliente?.nombreCompleto || user?.nombre || 'Vecino'
      : tienda?.nombreComercial || tienda?.nombre || user?.nombre || 'Defia Book';

  const displaySub =
    rol === 'ADMIN_SISTEMA'
      ? 'Superadmin Fintech Andina'
      : rol === 'CLIENTE'
      ? `Portal del Vecino · ${cliente?.tipoDoc ?? 'DNI'} ${cliente?.numDoc ?? ''}`
      : tienda?.razonSocial || 'Bodega Afiliada';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const content = (
    <div className="flex h-full w-[260px] flex-col bg-gradient-to-b from-[#0b3c5d] to-[#082b44] text-white shadow-[2px_0_12px_rgba(8,43,68,0.25)] border-r border-white/5">
      {/* Top & Navigation */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-5 px-2">
          <div className="flex items-center gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl shadow-md"
              style={{ backgroundImage: 'linear-gradient(135deg, #14b886 0%, #0f9d75 100%)' }}
            >
              <BookOpen className="size-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[17px] font-bold tracking-tight leading-tight">
                Defia <span className="text-[#65dbaf]">Book</span>
              </div>
              <p className="truncate text-[11px] font-medium text-white/60">
                Control de fiados y créditos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Cerrar menú lateral"
            className="lg:hidden rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav aria-label="Menú principal" className="mt-5 flex flex-col gap-2">
          {navItems.map((item) =>
            item.isCta ? (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className="my-1 flex h-11 items-center justify-between rounded-[10px] bg-[#0f9d75] px-3.5 text-[13.5px] font-semibold text-white shadow-[0_4px_7px_rgba(15,157,117,0.35)] transition-all hover:bg-[#14b886]"
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                <ChevronRight className="size-4 opacity-80" />
              </NavLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/mi-cuenta' || item.to === '/dashboard'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-[13.5px] font-medium tracking-tight transition-colors',
                    isActive
                      ? 'bg-[rgba(20,184,134,0.24)] text-white font-semibold'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3.5px] rounded-r-full bg-[#14b886]"
                      />
                    )}
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-[#061e30]/45 p-4 space-y-2">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00694d] text-xs font-bold text-white ring-2 ring-[#14b886]/60">
            {getInitials(displayName)}
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#14b886] ring-2 ring-[#082b44]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white">{displayName}</p>
            <p className="truncate text-[11px] text-white/60">{displaySub}</p>
          </div>
        </div>
        <div className="h-px bg-white/10" />
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        >
          <LogOut className="size-3.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="no-print hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
