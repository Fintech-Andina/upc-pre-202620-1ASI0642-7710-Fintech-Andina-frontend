import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getHomePathForRole } from '@/routes/ProtectedRoute';
import { extractApiErrorMessage } from '@/api/client';
import { FormField, inputBaseClass } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { HelpCenterDrawer } from '@/components/help/HelpCenterDrawer';

const registerSchema = z.object({
  ruc: z.string().regex(/^\d{11}$/, 'El RUC debe tener exactamente 11 dígitos numéricos'),
  razonSocial: z.string().min(3, 'La razón social debe tener al menos 3 caracteres'),
  nombreComercial: z.string().min(2, 'El nombre comercial debe tener al menos 2 caracteres'),
  direccion: z.string().min(3, 'La dirección es obligatoria'),
  telefono: z.string().optional(),
  monedaDefecto: z.enum(['PEN', 'USD']),
  horaCorte: z.coerce.number().int().min(0).max(23),
  email: z.string().email('Debe proporcionar un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { isAuthenticated, rol, register: registerTienda } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      monedaDefecto: 'PEN',
      horaCorte: 18,
    },
  });

  if (isAuthenticated && rol) {
    return <Navigate to={getHomePathForRole(rol)} replace />;
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const userRol = await registerTienda({
        ruc: values.ruc,
        razonSocial: values.razonSocial,
        nombreComercial: values.nombreComercial,
        direccion: values.direccion,
        telefono: values.telefono || '',
        monedaDefecto: values.monedaDefecto,
        horaCorte: values.horaCorte,
        email: values.email,
        password: values.password,
        rol: 'ADMIN_NEGOCIO',
      });
      toast.success('Tienda registrada exitosamente. ¡Bienvenido a Defia Book!');
      navigate(getHomePathForRole(userRol), { replace: true });
    } catch (err) {
      setServerError(extractApiErrorMessage(err, 'No se pudo completar el registro'));
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff] p-3 sm:p-5 flex items-center justify-center">
      <div className="w-full max-w-[1240px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_25px_-5px_rgba(11,60,93,0.12)] grid grid-cols-1 lg:grid-cols-12">
        {/* Left Panel */}
        <div
          className="lg:col-span-5 relative flex flex-col justify-between overflow-hidden p-8 sm:p-10 text-white"
          style={{
            backgroundImage:
              'linear-gradient(122deg, rgb(11, 60, 93) 0%, rgb(8, 43, 67) 50%, rgb(0, 105, 77) 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#00694d] shadow-md">
              <BookOpen className="size-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold tracking-tight">
                Defia <span className="text-[#65dbaf]">Book</span>
              </p>
              <p className="text-xs text-[#d9e3f1]/80">Plataforma de Crédito Vecinal</p>
            </div>
          </div>

          <div className="my-8 space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#65dbaf]">
              <span className="size-2 rounded-full bg-[#82f8ca]" />
              Alta inmediata para bodegas y comercios
            </span>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              Digitaliza tu libreta de fiados en minutos
            </h1>
            <p className="text-sm text-[#d9e3f1]/90 leading-relaxed">
              Crea la cuenta de tu negocio para gestionar límites de crédito, emitir cronogramas en
              método francés y emitir estados de cuenta transparentes para tus vecinos.
            </p>

            <ul className="space-y-3 text-xs text-[#d9e3f1]/90">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-[#65dbaf]" />
                Motor financiero en base comercial de 360 días y meses de 30 días.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-[#65dbaf]" />
                Validación automática frente a topes referenciales BCRP (PEN y USD).
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="size-4 shrink-0 text-[#65dbaf]" />
                Portal exclusivo de consulta para cada vecino con su DNI o correo.
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-white/10 p-4 text-xs text-[#d9e3f1]/90 backdrop-blur-xs">
            <p className="font-semibold text-white">Transparencia Metodológica</p>
            <p className="mt-1">
              Basado en buenas prácticas financieras y estándares de transparencia (referencia
              metodológica BCRP / SBS y Ley N.° 31143).
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b3c5d] hover:text-[#00694d]"
            >
              <ArrowLeft className="size-3.5" />
              Volver a iniciar sesión
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1 text-xs font-medium text-[#3d4a43] hover:bg-[#edf4ff] cursor-pointer"
              >
                <HelpCircle className="size-3.5 text-[#00694d]" />
                Ayuda
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4effd] px-3 py-1 text-xs font-medium text-[#3d4a43]">
                <Lock className="size-3.5 text-[#0b3c5d]" />
                Registro cifrado
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-[#121d26]">
              Registrar nueva tienda
            </h2>
            <p className="mt-1 text-sm text-[#3d4a43]">
              Completa los datos comerciales de tu bodega. Todos los campos cuentan con ayuda contextual (?).
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="RUC (11 dígitos)"
                htmlFor="ruc"
                helpKey="register.ruc"
                required
                error={errors.ruc?.message}
              >
                <input
                  id="ruc"
                  type="text"
                  maxLength={11}
                  placeholder="20601234567"
                  className={inputBaseClass}
                  {...register('ruc')}
                />
              </FormField>

              <FormField
                label="Nombre Comercial"
                htmlFor="nombreComercial"
                helpKey="register.nombreComercial"
                required
                error={errors.nombreComercial?.message}
              >
                <input
                  id="nombreComercial"
                  type="text"
                  placeholder="Bodega El Vecino"
                  className={inputBaseClass}
                  {...register('nombreComercial')}
                />
              </FormField>
            </div>

            <FormField
              label="Razón Social"
              htmlFor="razonSocial"
              helpKey="register.razonSocial"
              required
              error={errors.razonSocial?.message}
            >
              <input
                id="razonSocial"
                type="text"
                placeholder="Bodega El Vecino E.I.R.L."
                className={inputBaseClass}
                {...register('razonSocial')}
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Dirección del local"
                htmlFor="direccion"
                helpKey="register.direccion"
                required
                error={errors.direccion?.message}
              >
                <input
                  id="direccion"
                  type="text"
                  placeholder="Jr. Las Magnolias 245, Surco"
                  className={inputBaseClass}
                  {...register('direccion')}
                />
              </FormField>

              <FormField
                label="Teléfono / WhatsApp"
                htmlFor="telefono"
                helpKey="register.telefono"
                error={errors.telefono?.message}
              >
                <input
                  id="telefono"
                  type="text"
                  placeholder="+51 987654321"
                  className={inputBaseClass}
                  {...register('telefono')}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Moneda por defecto"
                htmlFor="monedaDefecto"
                helpKey="register.monedaDefecto"
                required
                error={errors.monedaDefecto?.message}
              >
                <select id="monedaDefecto" className={inputBaseClass} {...register('monedaDefecto')}>
                  <option value="PEN">PEN — Soles (S/)</option>
                  <option value="USD">USD — Dólares (US$)</option>
                </select>
              </FormField>

              <FormField
                label="Hora de corte diario (0–23)"
                htmlFor="horaCorte"
                helpKey="register.horaCorte"
                required
                error={errors.horaCorte?.message}
              >
                <input
                  id="horaCorte"
                  type="number"
                  min={0}
                  max={23}
                  className={inputBaseClass}
                  {...register('horaCorte')}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Correo electrónico de acceso"
                htmlFor="email"
                helpKey="login.email"
                required
                error={errors.email?.message}
              >
                <input
                  id="email"
                  type="email"
                  placeholder="admin@mibodega.pe"
                  className={inputBaseClass}
                  {...register('email')}
                />
              </FormField>

              <FormField
                label="Contraseña"
                htmlFor="password"
                helpKey="login.password"
                required
                error={errors.password?.message}
              >
                <input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className={inputBaseClass}
                  {...register('password')}
                />
              </FormField>
            </div>

            {serverError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-[#ffdad6] px-3 py-2 text-xs font-semibold text-[#93000a]"
              >
                <AlertCircle className="size-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <Button type="submit" loading={isSubmitting} size="lg" className="w-full h-12 rounded-xl">
              Crear cuenta de tienda
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#64748b]">
            <ShieldCheck className="size-4 text-[#00694d]" />
            <span>Datos protegidos conforme a la Ley N.° 29733.</span>
          </div>
        </div>
      </div>

      <HelpCenterDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
