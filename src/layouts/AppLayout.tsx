import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { HelpCenterDrawer } from '@/components/help/HelpCenterDrawer';
import { useAuth } from '@/context/AuthContext';
import { reportesApi } from '@/api/endpoints';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { rol } = useAuth();
  const navigate = useNavigate();

  const { data: dashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportesApi.dashboard,
    enabled: rol === 'ADMIN_NEGOCIO',
    staleTime: 30_000,
  });

  const overdueBadge =
    dashboard && dashboard.resumenCartera.carteraVencidaEnMora > 0 ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="lg:pl-[260px] flex min-h-screen flex-col">
        <Topbar
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
          overdueCount={overdueBadge}
          onClickAlerts={() => navigate('/creditos')}
        />

        <main className="flex-1 p-4 sm:p-7 max-w-[1520px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <HelpCenterDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
