import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { clientesApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField, inputBaseClass } from '@/components/ui/FormField';
import { PageLoader } from '@/components/ui/EmptyState';
import { BCRP_LIMITS_REF } from '@/utils/formatters';

const clienteFormSchema = z.object({
  nombreCompleto: z.string().min(3, 'El nombre completo debe tener al menos 3 caracteres'),
  tipoDoc: z.enum(['DNI', 'CE', 'RUC']),
  numDoc: z
    .string()
    .regex(/^\d{8,11}$/, 'El número de documento debe tener entre 8 y 11 dígitos numéricos'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  email: z
    .string()
    .email('Formato de correo inválido')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Mínimo 6 caracteres')
    .optional()
    .or(z.literal('')),
  ingresosNetos: z.coerce.number().min(0, 'No puede ser negativo'),
  moneda: z.enum(['PEN', 'USD']),
  tipoTasa: z.enum(['Efectiva', 'Nominal']),
  tasaPct: z.coerce.number().positive('La tasa debe ser mayor a 0%'),
  capitalizacion: z.coerce.number().int().positive(),
  teaMoraPct: z.coerce.number().min(0, 'La tasa moratoria no puede ser negativa'),
  diaCorte: z.coerce.number().int().min(1).max(28, 'Debe estar entre 1 y 28'),
  diaPago: z.coerce.number().int().min(1).max(28, 'Debe estar entre 1 y 28'),
  limiteCredito: z.coerce.number().positive('El límite debe ser mayor a 0'),
  maxMeses: z.coerce.number().int().min(1, 'Al menos 1 mes'),
});

type ClienteFormValues = z.infer<typeof clienteFormSchema>;

export function ClienteFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesApi.obtenerPorId(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      tipoDoc: 'DNI',
      moneda: 'PEN',
      tipoTasa: 'Efectiva',
      tasaPct: 30,
      capitalizacion: 12,
      teaMoraPct: 25,
      diaCorte: 15,
      diaPago: 25,
      ingresosNetos: 2500,
      limiteCredito: 1500,
      maxMeses: 12,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        nombreCompleto: existing.nombreCompleto,
        tipoDoc: existing.tipoDoc,
        numDoc: existing.numDoc,
        telefono: existing.telefono ?? '',
        direccion: existing.direccion ?? '',
        email: existing.email ?? '',
        password: '',
        ingresosNetos: existing.ingresosNetos,
        moneda: existing.moneda,
        tipoTasa: existing.tipoTasa,
        tasaPct: Number((existing.tasa * 100).toFixed(4)),
        capitalizacion: existing.capitalizacion,
        teaMoraPct: Number((existing.teaMora * 100).toFixed(4)),
        diaCorte: existing.diaCorte,
        diaPago: existing.diaPago,
        limiteCredito: existing.limiteCredito,
        maxMeses: existing.maxMeses,
      });
    }
  }, [existing, reset]);

  const moneda = watch('moneda');
  const tipoTasa = watch('tipoTasa');
  const bcrp = BCRP_LIMITS_REF[moneda];

  const saveMutation = useMutation({
    mutationFn: async (values: ClienteFormValues) => {
      const payload = {
        nombreCompleto: values.nombreCompleto.trim(),
        tipoDoc: values.tipoDoc,
        numDoc: values.numDoc.trim(),
        telefono: values.telefono?.trim() || undefined,
        direccion: values.direccion?.trim() || undefined,
        email: values.email?.trim() || undefined,
        password: values.password?.trim() || undefined,
        ingresosNetos: values.ingresosNetos,
        moneda: values.moneda,
        tipoTasa: values.tipoTasa,
        tasa: values.tasaPct / 100,
        capitalizacion: values.capitalizacion,
        teaMora: values.teaMoraPct / 100,
        diaCorte: values.diaCorte,
        diaPago: values.diaPago,
        limiteCredito: values.limiteCredito,
        maxMeses: values.maxMeses,
      };

      if (isEdit && id) {
        return clientesApi.actualizar(id, payload);
      }
      return clientesApi.crear(payload);
    },
    onSuccess: (saved) => {
      toast.success(isEdit ? 'Cliente actualizado correctamente' : 'Cliente registrado exitosamente');
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
      void queryClient.invalidateQueries({ queryKey: ['cliente', saved.id] });
      navigate(`/clientes/${saved.id}`);
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });

  if (isEdit && isLoading) {
    return <PageLoader label="Cargando ficha del cliente..." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b3c5d] hover:text-[#00694d] cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            Volver
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">
            {isEdit ? `Editar Cliente: ${existing?.nombreCompleto}` : 'Registrar Nuevo Cliente (Vecino)'}
          </h1>
          <p className="text-sm text-[#64748b]">
            Define la identidad, línea de crédito aprobada y condiciones contractuales validadas contra topes BCRP.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-6">
        {/* Identidad */}
        <Card className="p-6 space-y-4">
          <h2 className="text-base font-bold text-[#0b3c5d] border-b border-[#e6ebf0] pb-3">
            1. Datos Personales y Acceso al Portal del Vecino
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Nombre completo"
              htmlFor="nombreCompleto"
              helpKey="cliente.nombreCompleto"
              required
              error={errors.nombreCompleto?.message}
              className="sm:col-span-2"
            >
              <input
                id="nombreCompleto"
                className={inputBaseClass}
                placeholder="Carlos Quispe Mamani"
                {...register('nombreCompleto')}
              />
            </FormField>

            <FormField
              label="Ingresos netos mensuales"
              htmlFor="ingresosNetos"
              helpKey="cliente.ingresosNetos"
              required
              error={errors.ingresosNetos?.message}
            >
              <input
                id="ingresosNetos"
                type="number"
                step="0.01"
                className={inputBaseClass}
                {...register('ingresosNetos')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Tipo documento"
              htmlFor="tipoDoc"
              helpKey="cliente.tipoDoc"
              required
              error={errors.tipoDoc?.message}
            >
              <select id="tipoDoc" className={inputBaseClass} {...register('tipoDoc')}>
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="RUC">RUC</option>
              </select>
            </FormField>

            <FormField
              label="Número documento"
              htmlFor="numDoc"
              helpKey="cliente.numDoc"
              required
              error={errors.numDoc?.message}
            >
              <input
                id="numDoc"
                maxLength={11}
                placeholder="10234567"
                className={inputBaseClass}
                {...register('numDoc')}
              />
            </FormField>

            <FormField
              label="Teléfono / WhatsApp"
              htmlFor="telefono"
              helpKey="cliente.telefono"
              error={errors.telefono?.message}
            >
              <input
                id="telefono"
                placeholder="+51 912345678"
                className={inputBaseClass}
                {...register('telefono')}
              />
            </FormField>
          </div>

          <FormField
            label="Dirección domiciliaria"
            htmlFor="direccion"
            helpKey="cliente.direccion"
            error={errors.direccion?.message}
          >
            <input
              id="direccion"
              placeholder="Calle Los Pinos 118, Surco"
              className={inputBaseClass}
              {...register('direccion')}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e6ebf0]">
            <FormField
              label="Correo para Portal del Vecino"
              htmlFor="email"
              helpKey="cliente.email"
              error={errors.email?.message}
            >
              <input
                id="email"
                type="email"
                placeholder="carlos.quispe@vecino.pe"
                className={inputBaseClass}
                {...register('email')}
              />
            </FormField>

            <FormField
              label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña para Portal (opcional)'}
              htmlFor="password"
              helpKey="cliente.password"
              error={errors.password?.message}
            >
              <input
                id="password"
                type="password"
                placeholder={isEdit ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
                className={inputBaseClass}
                {...register('password')}
              />
            </FormField>
          </div>
        </Card>

        {/* Condiciones Financieras */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6ebf0] pb-3">
            <h2 className="text-base font-bold text-[#0b3c5d]">
              2. Línea de Crédito y Condiciones Financieras Contractuales
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-semibold text-[#00694d]">
              <ShieldCheck className="size-3.5" />
              Tope {moneda}: {bcrp.compensatorioMaxPct}% comp. / {bcrp.moratorioMaxPct}% mora
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Moneda"
              htmlFor="moneda"
              helpKey="cliente.moneda"
              required
              error={errors.moneda?.message}
            >
              <select id="moneda" className={inputBaseClass} {...register('moneda')}>
                <option value="PEN">PEN — Soles (S/)</option>
                <option value="USD">USD — Dólares (US$)</option>
              </select>
            </FormField>

            <FormField
              label="Límite de crédito (L)"
              htmlFor="limiteCredito"
              helpKey="cliente.limiteCredito"
              required
              error={errors.limiteCredito?.message}
            >
              <input
                id="limiteCredito"
                type="number"
                step="0.01"
                className={inputBaseClass}
                {...register('limiteCredito')}
              />
            </FormField>

            <FormField
              label="Plazo máximo (meses)"
              htmlFor="maxMeses"
              helpKey="cliente.maxMeses"
              required
              error={errors.maxMeses?.message}
            >
              <input
                id="maxMeses"
                type="number"
                min={1}
                max={36}
                className={inputBaseClass}
                {...register('maxMeses')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <FormField
              label="Tipo de tasa"
              htmlFor="tipoTasa"
              helpKey="cliente.tipoTasa"
              required
              error={errors.tipoTasa?.message}
            >
              <select id="tipoTasa" className={inputBaseClass} {...register('tipoTasa')}>
                <option value="Efectiva">Efectiva (TEA)</option>
                <option value="Nominal">Nominal (TNA)</option>
              </select>
            </FormField>

            <FormField
              label={tipoTasa === 'Nominal' ? 'TNA (% anual)' : 'TEA (% anual)'}
              htmlFor="tasaPct"
              helpKey="cliente.tasa"
              required
              hint={`Ej. 36 para 36% (Máx. ref. ${bcrp.compensatorioMaxPct}% TEA)`}
              error={errors.tasaPct?.message}
            >
              <input
                id="tasaPct"
                type="number"
                step="0.01"
                className={inputBaseClass}
                {...register('tasaPct')}
              />
            </FormField>

            <FormField
              label="Capitalización (m)"
              htmlFor="capitalizacion"
              helpKey="cliente.capitalizacion"
              required
              error={errors.capitalizacion?.message}
            >
              <select
                id="capitalizacion"
                disabled={tipoTasa === 'Efectiva'}
                className={inputBaseClass}
                {...register('capitalizacion')}
              >
                <option value={12}>12 — Mensual</option>
                <option value={360}>360 — Diaria</option>
                <option value={4}>4 — Trimestral</option>
                <option value={2}>2 — Semestral</option>
                <option value={1}>1 — Anual</option>
              </select>
            </FormField>

            <FormField
              label="TEA Mora (% anual)"
              htmlFor="teaMoraPct"
              helpKey="cliente.teaMora"
              required
              hint={`Máx. ref. ${bcrp.moratorioMaxPct}% TEA`}
              error={errors.teaMoraPct?.message}
            >
              <input
                id="teaMoraPct"
                type="number"
                step="0.01"
                className={inputBaseClass}
                {...register('teaMoraPct')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Día de corte mensual (1–28)"
              htmlFor="diaCorte"
              helpKey="cliente.diaCorte"
              required
              error={errors.diaCorte?.message}
            >
              <input
                id="diaCorte"
                type="number"
                min={1}
                max={28}
                className={inputBaseClass}
                {...register('diaCorte')}
              />
            </FormField>

            <FormField
              label="Día de pago oportuno (1–28)"
              htmlFor="diaPago"
              helpKey="cliente.diaPago"
              required
              error={errors.diaPago?.message}
            >
              <input
                id="diaPago"
                type="number"
                min={1}
                max={28}
                className={inputBaseClass}
                {...register('diaPago')}
              />
            </FormField>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting || saveMutation.isPending}>
            <Save className="size-4" />
            {isEdit ? 'Guardar cambios' : 'Registrar cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
