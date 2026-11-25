import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Building2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { tiendasApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, inputBaseClass } from '@/components/ui/FormField';

const configSchema = z.object({
  razonSocial: z.string().min(3, 'Mínimo 3 caracteres'),
  nombreComercial: z.string().min(2, 'Mínimo 2 caracteres'),
  direccion: z.string().min(3, 'Mínimo 3 caracteres'),
  telefono: z.string().optional(),
  monedaDefecto: z.enum(['PEN', 'USD']),
  horaCorte: z.coerce.number().int().min(0).max(23),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export function ConfiguracionPage() {
  const { tienda, refreshMe } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      razonSocial: '',
      nombreComercial: '',
      direccion: '',
      telefono: '',
      monedaDefecto: 'PEN',
      horaCorte: 18,
    },
  });

  useEffect(() => {
    if (tienda) {
      reset({
        razonSocial: tienda.razonSocial ?? tienda.nombre,
        nombreComercial: tienda.nombreComercial ?? tienda.nombre,
        direccion: tienda.direccion,
        telefono: tienda.telefono ?? '',
        monedaDefecto: tienda.monedaDefecto ?? 'PEN',
        horaCorte: tienda.horaCorte ?? 18,
      });
    }
  }, [tienda, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: ConfigFormValues) =>
      tiendasApi.actualizarMiTienda({
        razonSocial: values.razonSocial.trim(),
        nombreComercial: values.nombreComercial.trim(),
        direccion: values.direccion.trim(),
        telefono: values.telefono?.trim() ?? '',
        monedaDefecto: values.monedaDefecto,
        horaCorte: values.horaCorte,
      }),
    onSuccess: async () => {
      await refreshMe();
      toast.success('Configuración comercial guardada y auditada en bitácora');
    },
    onError: (err) => toast.error(extractApiErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
          Parámetros del Negocio
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">Configuración</h1>
        <p className="mt-0.5 text-sm text-[#64748b]">
          Actualiza la información comercial y parámetros operativos de tu tienda en Defia Book.
        </p>
      </div>

      {/* Read-only Identity Card */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#0b3c5d]">
              <Building2 className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#121d26]">
                {tienda?.nombreComercial || tienda?.nombre || 'Tienda'}
              </h2>
              <p className="text-xs text-[#64748b]">
                RUC: <strong>{tienda?.ruc || '—'}</strong> · Correo:{' '}
                <strong>{tienda?.email || '—'}</strong>
              </p>
            </div>
          </div>
          <Badge variant="emerald">{tienda?.estado ?? 'ACTIVO'}</Badge>
        </div>
      </Card>

      {/* Editable Form */}
      <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))}>
        <Card className="p-6 space-y-5">
          <h2 className="text-base font-bold text-[#0b3c5d] border-b border-[#e6ebf0] pb-3">
            Datos Comerciales y Operativos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Razón Social"
              htmlFor="conf-rs"
              helpKey="config.razonSocial"
              required
              error={errors.razonSocial?.message}
            >
              <input id="conf-rs" className={inputBaseClass} {...register('razonSocial')} />
            </FormField>

            <FormField
              label="Nombre Comercial"
              htmlFor="conf-nc"
              helpKey="config.nombreComercial"
              required
              error={errors.nombreComercial?.message}
            >
              <input id="conf-nc" className={inputBaseClass} {...register('nombreComercial')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Dirección del establecimiento"
              htmlFor="conf-dir"
              helpKey="config.direccion"
              required
              error={errors.direccion?.message}
            >
              <input id="conf-dir" className={inputBaseClass} {...register('direccion')} />
            </FormField>

            <FormField
              label="Teléfono de contacto"
              htmlFor="conf-tel"
              helpKey="config.telefono"
              error={errors.telefono?.message}
            >
              <input id="conf-tel" className={inputBaseClass} {...register('telefono')} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Moneda predeterminada"
              htmlFor="conf-mon"
              helpKey="config.monedaDefecto"
              required
              error={errors.monedaDefecto?.message}
            >
              <select id="conf-mon" className={inputBaseClass} {...register('monedaDefecto')}>
                <option value="PEN">PEN — Soles (S/)</option>
                <option value="USD">USD — Dólares (US$)</option>
              </select>
            </FormField>

            <FormField
              label="Hora de corte diario (0–23)"
              htmlFor="conf-hc"
              helpKey="config.horaCorte"
              required
              error={errors.horaCorte?.message}
            >
              <input
                id="conf-hc"
                type="number"
                min={0}
                max={23}
                className={inputBaseClass}
                {...register('horaCorte')}
              />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e6ebf0]">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#64748b]">
              <ShieldCheck className="size-4 text-[#00694d]" />
              Convenciones fijas: Año comercial 360 días · Mes 30 días · Redondeo 2 decimales
            </span>
            <Button type="submit" loading={isSubmitting || updateMutation.isPending}>
              <Save className="size-4" />
              Guardar configuración
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
