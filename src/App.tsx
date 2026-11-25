import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { ProtectedRoute, getHomePathForRole } from '@/routes/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/merchant/DashboardPage';
import { ClientesPage } from '@/pages/merchant/ClientesPage';
import { ClienteFormPage } from '@/pages/merchant/ClienteFormPage';
import { ClienteDetailPage } from '@/pages/merchant/ClienteDetailPage';
import { ProductosPage } from '@/pages/merchant/ProductosPage';
import { ReglasFinanciamientoPage } from '@/pages/merchant/ReglasFinanciamientoPage';
import { NuevoCreditoWizardPage } from '@/pages/merchant/NuevoCreditoWizardPage';
import { CreditosPage } from '@/pages/merchant/CreditosPage';
import { CreditoDetailPage } from '@/pages/merchant/CreditoDetailPage';
import { ReportesPage } from '@/pages/merchant/ReportesPage';
import { ConfiguracionPage } from '@/pages/merchant/ConfiguracionPage';
import { AdminSaludPage, AdminTiendasPage } from '@/pages/admin/AdminTiendasPage';
import { ClientPortalPage } from '@/pages/client/ClientPortalPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootRedirect() {
  const { isAuthenticated, rol } = useAuth();
  if (!isAuthenticated || !rol) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getHomePathForRole(rol)} replace />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Role 1: ADMIN_NEGOCIO */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN_NEGOCIO']} />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/clientes/nuevo" element={<ClienteFormPage />} />
                  <Route path="/clientes/:id" element={<ClienteDetailPage />} />
                  <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
                  <Route path="/productos" element={<ProductosPage />} />
                  <Route path="/reglas" element={<ReglasFinanciamientoPage />} />
                  <Route path="/creditos/nuevo" element={<NuevoCreditoWizardPage />} />
                  <Route path="/creditos" element={<CreditosPage />} />
                  <Route path="/creditos/:id" element={<CreditoDetailPage />} />
                  <Route path="/reportes" element={<ReportesPage />} />
                  <Route path="/configuracion" element={<ConfiguracionPage />} />
                </Route>
              </Route>

              {/* Role 2: ADMIN_SISTEMA */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN_SISTEMA']} />}>
                <Route element={<AppLayout />}>
                  <Route path="/admin/tiendas" element={<AdminTiendasPage />} />
                  <Route path="/admin/salud" element={<AdminSaludPage />} />
                </Route>
              </Route>

              {/* Role 3: CLIENTE */}
              <Route element={<ProtectedRoute allowedRoles={['CLIENTE']} />}>
                <Route element={<AppLayout />}>
                  <Route
                    path="/mi-cuenta"
                    element={<ClientPortalPage initialSection="resumen" />}
                  />
                  <Route
                    path="/mi-cuenta/estado-cuenta"
                    element={<ClientPortalPage initialSection="estado-cuenta" />}
                  />
                  <Route
                    path="/mi-cuenta/creditos"
                    element={<ClientPortalPage initialSection="creditos" />}
                  />
                </Route>
              </Route>

              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors closeButton />
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
