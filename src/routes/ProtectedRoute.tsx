import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui/EmptyState';
import type { RolUsuario } from '@/types/api';

export function getHomePathForRole(rol: RolUsuario | null): string {
  if (rol === 'ADMIN_SISTEMA') return '/admin/tiendas';
  if (rol === 'CLIENTE') return '/mi-cuenta';
  return '/dashboard';
}

export function ProtectedRoute({ allowedRoles }: { allowedRoles: RolUsuario[] }) {
  const { isAuthenticated, isLoading, rol } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fa]">
        <PageLoader label="Verificando sesión segura..." />
      </div>
    );
  }

  if (!isAuthenticated || !rol) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(rol)) {
    return <Navigate to={getHomePathForRole(rol)} replace />;
  }

  return <Outlet />;
}
