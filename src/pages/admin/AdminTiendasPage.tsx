import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Building2, CheckCircle2, Plus, Power, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, healthApi, tiendasApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { FormField, inputBaseClass } from '@/components/ui/FormField';
import { PageLoader } from '@/components/ui/EmptyState';
import { formatDatePE } from '@/utils/formatters';

const nuevaTiendaSchema = z.object({
  ruc: z.string().regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos numéricos'),
  razonSocial: z.string().min(3, 'Mínimo 3 caracteres'),
  nombreComercial: z.string().min(2, 'Mínimo 2 caracteres'),
  direccion: z.string().min(3, 'Mínimo 3 caracteres'),
  telefono: z.string().optional(),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  monedaDefecto: z.enum(['PEN', 'USD']),
  horaCorte: z.coerce.number().int().min(0).max(23),
});

type NuevaTiendaValues = z.infer<typeof nuevaTiendaSchema>;

export function AdminTiendasPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: tiendas = [], isLoading } = useQuery({
    queryKey: ['admin', 'tiendas'],
    queryFn: tiendasApi.listar,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'ACTIVO' | 'INACTIVO' }) =>
      tiendasApi.cambiarEstado(id, estado),
    onSuccess: (updated) => {
      toast.success(`Tienda "${updated.nombre}" cambiada a estado ${updated.estado}`);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tiendas'] });
    },
    onError: (err) => toast.error(extractApiErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NuevaTiendaValues>({
    resolver: zodResolver(nuevaTiendaSchema),
    defaultValues: {
      monedaDefecto: 'PEN',
      horaCorte: 18,
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: NuevaTiendaValues) =>
      authApi.registerAsAdmin({
        ...values,
        rol: 'ADMIN_NEGOCIO',
      }),
    onSuccess: (res) => {
      toast.success(`Tienda "${res.tienda?.nombre}" registrada exitosamente`);
      reset({ monedaDefecto: 'PEN', horaCorte: 18 });
      setModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tiendas'] });
    },
    onError: (err) => toast.error(extractApiErrorMessage(err)),
  });

  if (isLoading) {
    return <PageLoader label="Cargando tiendas afiliadas..." />;
  }

  const q = search.trim().toLowerCase();
  const filtered = tiendas.filter(
    (t) =>
      !q ||
      t.nombre.toLowerCase().includes(q) ||
      t.ruc.includes(q) ||
      (t.email ?? '').toLowerCase().includes(q)
  );

  const activas = tiendas.filter((t) => (t.estado ?? 'ACTIVO').toUpperCase() === 'ACTIVO').length;
  const inactivas = tiendas.length - activas;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
            Panel Superadmin · Fintech Andina S.A.C.
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">
            Gestión de Tiendas Afiliadas
          </h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Administra el alta, baja operativa (ACTIVO / INACTIVO) y registro de bodegas en la plataforma.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Registrar nueva tienda
        </Button>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold text-[#64748b]">Total Cuentas / Tiendas</p>
          <p className="mt-1 text-2xl font-bold text-[#121d26] tabular-nums">{tiendas.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-[#64748b]">Tiendas Activas</p>
          <p className="mt-1 text-2xl font-bold text-[#00694d] tabular-nums">{activas}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold text-[#64748b]">Tiendas Desactivadas</p>
          <p className="mt-1 text-2xl font-bold text-[#ba1a1a] tabular-nums">{inactivas}</p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tienda por nombre, RUC o correo..."
            className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm focus:border-[#0f9d75] focus:bg-white focus:outline-none"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="table-region" role="region" tabIndex={0} aria-label="Tiendas registradas">
          <table>
            <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              <tr>
                <th className="px-5 py-3.5">Tienda / Razón Social</th>
                <th className="px-4 py-3.5">RUC / Correo</th>
                <th className="px-4 py-3.5">Rol</th>
                <th className="px-4 py-3.5">Moneda / Corte</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Alta / Baja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf0] text-sm">
              {filtered.map((t) => {
                const isActivo = (t.estado ?? 'ACTIVO').toUpperCase() === 'ACTIVO';
                const isSelf = t.id === user?.id || t.rol === 'ADMIN_SISTEMA';
                return (
                  <tr key={t.id} className="hover:bg-[#f4f7fa]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#121d26]">{t.nombreComercial || t.nombre}</p>
                      <p className="text-xs text-[#64748b]">
                        {t.razonSocial || t.direccion} · Alta: {formatDatePE(t.creadoEn)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <p className="font-semibold tabular-nums">RUC {t.ruc}</p>
                      <p className="text-[#64748b]">{t.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={t.rol === 'ADMIN_SISTEMA' ? 'navy' : 'slate'}>
                        {t.rol || 'ADMIN_NEGOCIO'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className="font-semibold">{t.monedaDefecto}</span> · Corte {t.horaCorte}:00h
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={isActivo ? 'emerald' : 'red'}>
                        {isActivo ? 'ACTIVO' : 'INACTIVO'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isSelf ? (
                        <span className="text-xs text-[#64748b]">Cuenta Sistema</span>
                      ) : (
                        <Button
                          size="sm"
                          variant={isActivo ? 'outline' : 'primary'}
                          loading={toggleMutation.isPending}
                          onClick={() =>
                            toggleMutation.mutate({
                              id: t.id,
                              estado: isActivo ? 'INACTIVO' : 'ACTIVO',
                            })
                          }
                        >
                          <Power className="size-3.5" />
                          {isActivo ? 'Desactivar' : 'Activar'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Register Modal */}
      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar nueva tienda afiliada"
        subtitle="Crea una cuenta comercial activa (ADMIN_NEGOCIO) sin cerrar tu sesión de Superadmin."
        icon={<Building2 className="size-5" />}
        maxWidthClass="max-w-2xl"
        footer={
          <>
            <span className="text-xs text-[#64748b]">Se auditará automáticamente en Bitácora.</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="admin-new-tienda-form"
                loading={isSubmitting || createMutation.isPending}
              >
                Registrar tienda
              </Button>
            </div>
          </>
        }
      >
        <form
          id="admin-new-tienda-form"
          onSubmit={handleSubmit((v) => createMutation.mutate(v))}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="RUC (11 dígitos)"
              htmlFor="adm-ruc"
              helpKey="register.ruc"
              required
              error={errors.ruc?.message}
            >
              <input id="adm-ruc" maxLength={11} className={inputBaseClass} {...register('ruc')} />
            </FormField>
            <FormField
              label="Nombre Comercial"
              htmlFor="adm-nc"
              helpKey="register.nombreComercial"
              required
              error={errors.nombreComercial?.message}
            >
              <input id="adm-nc" className={inputBaseClass} {...register('nombreComercial')} />
            </FormField>
          </div>

          <FormField
            label="Razón Social"
            htmlFor="adm-rs"
            helpKey="register.razonSocial"
            required
            error={errors.razonSocial?.message}
          >
            <input id="adm-rs" className={inputBaseClass} {...register('razonSocial')} />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Dirección"
              htmlFor="adm-dir"
              helpKey="register.direccion"
              required
              error={errors.direccion?.message}
            >
              <input id="adm-dir" className={inputBaseClass} {...register('direccion')} />
            </FormField>
            <FormField label="Teléfono" htmlFor="adm-tel" helpKey="register.telefono">
              <input id="adm-tel" className={inputBaseClass} {...register('telefono')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Moneda por defecto"
              htmlFor="adm-mon"
              helpKey="register.monedaDefecto"
              required
            >
              <select id="adm-mon" className={inputBaseClass} {...register('monedaDefecto')}>
                <option value="PEN">PEN (S/)</option>
                <option value="USD">USD (US$)</option>
              </select>
            </FormField>
            <FormField
              label="Hora corte (0–23)"
              htmlFor="adm-hc"
              helpKey="register.horaCorte"
              required
            >
              <input
                id="adm-hc"
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
              label="Correo electrónico"
              htmlFor="adm-email"
              helpKey="login.email"
              required
              error={errors.email?.message}
            >
              <input id="adm-email" type="email" className={inputBaseClass} {...register('email')} />
            </FormField>
            <FormField
              label="Contraseña inicial"
              htmlFor="adm-pass"
              helpKey="login.password"
              required
              error={errors.password?.message}
            >
              <input
                id="adm-pass"
                type="password"
                className={inputBaseClass}
                {...register('password')}
              />
            </FormField>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}

export function AdminSaludPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
  });

  if (isLoading) return <PageLoader label="Verificando salud de la API..." />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#121d26]">Estado del Sistema</h1>
          <p className="text-sm text-[#64748b]">Diagnóstico en tiempo real del backend Defia Book</p>
        </div>
        <Button variant="outline" onClick={() => void refetch()}>
          <Activity className="size-4" />
          Reverificar
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#00694d]">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-base font-bold text-[#121d26]">{data?.app ?? 'Defia Book Backend'}</p>
            <Badge variant="emerald">{data?.status ?? 'healthy'}</Badge>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 text-xs border-t border-[#e6ebf0] pt-4">
          <div>
            <dt className="text-[#64748b]">Organización</dt>
            <dd className="font-bold text-[#121d26]">{data?.organizacion}</dd>
          </div>
          <div>
            <dt className="text-[#64748b]">Versión API</dt>
            <dd className="font-bold text-[#121d26]">{data?.version}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[#64748b]">Último timestamp</dt>
            <dd className="font-mono text-[#0b3c5d]">{data?.timestamp}</dd>
          </div>
        </dl>
        <div className="rounded-xl bg-[#edf4ff] p-3 text-xs text-[#3d4a43] flex items-center gap-2">
          <ShieldCheck className="size-4 text-[#00694d]" />
          <span>Motor financiero matemático operativo y conectado a PostgreSQL (Neon).</span>
        </div>
      </Card>
    </div>
  );
}
