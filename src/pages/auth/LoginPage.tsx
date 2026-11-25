import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  Percent,
  Scale,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getHomePathForRole } from '@/routes/ProtectedRoute';
import { extractApiErrorMessage } from '@/api/client';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { HelpCenterDrawer } from '@/components/help/HelpCenterDrawer';

const loginFormSchema = z.object({
  identifier: z.string().min(3, 'Ingresa tu correo o DNI'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const DEMO_ACCOUNTS = [
  {
    label: 'Bodega Don Lucho',
    role: 'ADMIN_NEGOCIO',
    mode: 'email' as const,
    identifier: 'donlucho@bodegaelvecino.pe',
    password: '12345678',
  },
  {
    label: 'Superadmin Sistema',
    role: 'ADMIN_SISTEMA',
    mode: 'email' as const,
    identifier: 'admin@fintechandina.pe',
    password: '12345678',
  },
  {
    label: 'Vecino Carlos Quispe',
    role: 'CLIENTE (Email)',
    mode: 'email' as const,
    identifier: 'carlos.quispe@vecino.pe',
    password: '12345678',
  },
  {
    label: 'Vecino por DNI',
    role: 'CLIENTE (DNI)',
    mode: 'dni' as const,
    identifier: '10234567',
    password: '12345678',
  },
];

export function LoginPage() {
  const { isAuthenticated, rol, login, loginCliente } = useAuth();
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState<'email' | 'dni'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showDemos, setShowDemos] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  if (isAuthenticated && rol) {
    return <Navigate to={getHomePathForRole(rol)} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const cleanId = values.identifier.trim();
      const useClienteDni = loginMode === 'dni' || (!cleanId.includes('@') && /^\d{8,11}$/.test(cleanId));

      const userRol = useClienteDni
        ? await loginCliente(cleanId, values.password)
        : await login(cleanId, values.password);

      toast.success('Sesión iniciada correctamente');
      navigate(getHomePathForRole(userRol), { replace: true });
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Usuario o contraseña incorrectos');
      setServerError(msg);
    }
  };

  const applyDemo = (demo: (typeof DEMO_ACCOUNTS)[number]) => {
    setLoginMode(demo.mode);
    setValue('identifier', demo.identifier, { shouldValidate: true });
    setValue('password', demo.password, { shouldValidate: true });
    setServerError(null);
    toast.info(`Credenciales cargadas: ${demo.label}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff] p-3 sm:p-5 flex items-center justify-center">
      <div className="w-full max-w-[1240px] min-h-[760px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_25px_-5px_rgba(11,60,93,0.12)] grid grid-cols-1 lg:grid-cols-2">
        {/* LEFT COLUMN: Brand & Value Proposition */}
        <div
          className="relative flex flex-col justify-between overflow-hidden p-8 sm:p-12 lg:p-14 text-white"
          style={{
            backgroundImage:
              'linear-gradient(122deg, rgb(11, 60, 93) 0%, rgb(8, 43, 67) 50%, rgb(0, 105, 77) 100%)',
          }}
        >
          <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-[#65dbaf]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-[#00694d]/25 blur-3xl" />

          {/* Brand header */}
          <div className="relative flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#00694d] shadow-md shadow-[#00694d]/40">
              <BookOpen className="size-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight leading-tight">
                Defia <span className="text-[#65dbaf]">Book</span>
              </p>
              <p className="text-xs text-[#d9e3f1]/80">
                Control de fiados y créditos para bodegas
              </p>
            </div>
          </div>

          {/* Core messaging */}
          <div className="relative my-8 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#65dbaf] backdrop-blur-xs">
                <span className="size-2 rounded-full bg-[#82f8ca]" />
                Finanzas transparentes para el Perú
              </span>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15]">
                Tu cuaderno de fiados, ahora con números claros
              </h1>

              <p className="max-w-lg text-sm sm:text-base text-[#d9e3f1]/90 leading-relaxed">
                Reemplaza las libretas de papel por cronogramas formales, trazabilidad exacta de
                pagos y el respaldo metodológico que tu bodega de barrio merece.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3.5 rounded-xl bg-white/5 p-3.5 backdrop-blur-xs">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#65dbaf]/20 text-[#65dbaf]">
                  <CalendarClock className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Cronogramas de pago automáticos
                  </h2>
                  <p className="mt-0.5 text-xs text-[#d9e3f1]/80">
                    Cuotas niveladas en método francés y estados de cuenta al corte claros para tus caseros.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl bg-white/5 p-3.5 backdrop-blur-xs">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#65dbaf]/20 text-[#65dbaf]">
                  <Percent className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">TCEA y TREA transparentes</h2>
                  <p className="mt-0.5 text-xs text-[#d9e3f1]/80">
                    Cálculos financieros formales en base 360 días sin ambigüedades para el comercio minorista.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-xl bg-white/5 p-3.5 backdrop-blur-xs">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#65dbaf]/20 text-[#65dbaf]">
                  <Scale className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Buenas prácticas y topes contra la usura
                  </h2>
                  <p className="mt-0.5 text-xs text-[#d9e3f1]/80">
                    Basado en buenas prácticas financieras y estándares de transparencia (referencia
                    metodológica BCRP / SBS y Ley N.° 31143).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust pill */}
          <div className="relative flex items-center gap-3.5 rounded-xl bg-white/10 p-4 backdrop-blur-md">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00694d] text-white shadow-xs">
              <CheckCircle2 className="size-5 text-[#82f8ca]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Fintech Andina S.A.C. · Motor Matemático Auditado
              </p>
              <p className="text-xs text-[#d9e3f1]/80">
                Prelación legal de pagos, cero anatocismo en mora y control de línea en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Authentication Form */}
        <div className="flex flex-col justify-between bg-white p-6 sm:p-10 lg:p-14">
          {/* Top security pill + help */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowDemos((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[11.5px] font-semibold text-[#0b3c5d] hover:bg-[#edf4ff] cursor-pointer"
            >
              <Sparkles className="size-3.5 text-[#0f9d75]" />
              Accesos demo
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                aria-label="Abrir Centro de Ayuda"
                className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#3d4a43] hover:bg-[#edf4ff] cursor-pointer"
              >
                <HelpCircle className="size-3.5 text-[#00694d]" />
                Ayuda
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4effd] px-3 py-1 text-xs font-medium text-[#3d4a43]">
                <Lock className="size-3.5 text-[#0b3c5d]" />
                Acceso seguro JWT
              </span>
            </div>
          </div>

          {/* Discreet Demo Credentials Drawer/Bar for Presentation */}
          {showDemos && (
            <div className="mt-4 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5]/70 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#00694d]">
                Credenciales de Sustentación (clave: 12345678)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => applyDemo(demo)}
                    className="flex flex-col items-start rounded-lg border border-[#a7f3d0] bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-[#ecfdf5] cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#0b3c5d]">{demo.label}</span>
                    <span className="text-[10.5px] text-[#3d4a43]">
                      {demo.role} · {demo.identifier}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main form container */}
          <div className="mx-auto my-auto w-full max-w-[440px] py-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#121d26]">
                Bienvenido de nuevo
              </h2>
              <p className="mt-1 text-sm text-[#3d4a43]">
                Ingresa a tu cuenta para gestionar clientes, créditos o consultar tu estado de cuenta.
              </p>
            </div>

            {/* Mode Switch */}
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-[#e6ebf0] bg-[#f4f7fa] p-1">
              <button
                type="button"
                onClick={() => setLoginMode('email')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  loginMode === 'email'
                    ? 'bg-white text-[#0b3c5d] shadow-2xs'
                    : 'text-[#64748b] hover:text-[#121d26]'
                }`}
              >
                <Mail className="size-3.5" />
                Correo (Tienda / Admin / Vecino)
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('dni')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  loginMode === 'dni'
                    ? 'bg-white text-[#0b3c5d] shadow-2xs'
                    : 'text-[#64748b] hover:text-[#121d26]'
                }`}
              >
                <UserCheck className="size-3.5" />
                DNI (Portal Vecino)
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label={loginMode === 'dni' ? 'DNI o correo del vecino' : 'Correo electrónico'}
                htmlFor="identifier"
                helpKey={loginMode === 'dni' ? 'login.dni' : 'login.email'}
                required
                error={errors.identifier?.message}
              >
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder={
                      loginMode === 'dni'
                        ? 'Ej. 10234567 o carlos.quispe@vecino.pe'
                        : 'donlucho@bodegaelvecino.pe'
                    }
                    className="w-full rounded-xl border border-[#e2e8f0] bg-white py-3 pl-10 pr-4 text-sm text-[#121d26] shadow-2xs focus:border-[#0f9d75] focus:outline-none focus:ring-2 focus:ring-[#0f9d75]/15"
                    {...register('identifier')}
                  />
                </div>
              </FormField>

              <FormField
                label="Contraseña"
                htmlFor="password"
                helpKey="login.password"
                required
                error={errors.password?.message}
              >
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className={`w-full rounded-xl border py-3 pl-10 pr-11 text-sm text-[#121d26] shadow-2xs focus:outline-none focus:ring-2 ${
                      serverError
                        ? 'border-[#ba1a1a]/50 bg-[#ffdad6]/20 focus:border-[#ba1a1a] focus:ring-[#ba1a1a]/15'
                        : 'border-[#e2e8f0] bg-white focus:border-[#0f9d75] focus:ring-[#0f9d75]/15'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#64748b] hover:bg-slate-100 hover:text-[#121d26]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormField>

              {serverError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-lg bg-[#ffdad6] px-3 py-2 text-xs font-semibold text-[#93000a]"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                size="lg"
                className="w-full h-12 rounded-xl text-sm"
              >
                Ingresar
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#3d4a43]">
              ¿Tu bodega aún no tiene cuenta?{' '}
              <Link to="/register" className="font-bold text-[#00694d] hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>

          {/* Footer compliance notice */}
          <div className="border-t border-[#e6ebf0] pt-4 flex items-center justify-center gap-2 text-center text-[11.5px] text-[#64748b]">
            <ShieldCheck className="size-4 shrink-0 text-[#00694d]" />
            <span>
              Tus datos están protegidos según la Ley N.° 29733 (Ley de Protección de Datos Personales del Perú).
            </span>
          </div>
        </div>
      </div>

      <HelpCenterDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
