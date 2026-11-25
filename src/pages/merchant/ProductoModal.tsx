import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, ImageOff, PackagePlus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { productosApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import type { Producto } from '@/types/api';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { Button } from '@/components/ui/Button';
import { FormField, inputBaseClass } from '@/components/ui/FormField';

const productoSchema = z
  .object({
    sku: z.string().optional(),
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    marca: z.string().optional(),
    proveedor: z.string().optional(),
    unidadMedida: z.string().optional(),
    imagenUrl: z.string().optional(),
    descripcion: z.string().optional(),
    precioContado: z.coerce.number().positive('Pc debe ser mayor a 0'),
    precioLista: z.coerce.number().positive('PL debe ser mayor a 0'),
    permitePagoUnico: z.boolean(),
    permiteCuotas: z.boolean(),
  })
  .refine((v) => v.permitePagoUnico || v.permiteCuotas, {
    message: 'Selecciona al menos una modalidad permitida (Pago Único o Cuotas)',
    path: ['permiteCuotas'],
  });

type ProductoFormValues = z.infer<typeof productoSchema>;

export function ProductoModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Producto | null;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      sku: '',
      nombre: '',
      marca: '',
      proveedor: '',
      unidadMedida: 'UNIDAD',
      imagenUrl: '',
      descripcion: '',
      precioContado: 100,
      precioLista: 100,
      permitePagoUnico: true,
      permiteCuotas: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        reset({
          sku: editing.sku,
          nombre: editing.nombre,
          marca: editing.marca ?? '',
          proveedor: editing.proveedor ?? '',
          unidadMedida: editing.unidadMedida ?? 'UNIDAD',
          imagenUrl: editing.imagenUrl ?? '',
          descripcion: editing.descripcion ?? '',
          precioContado: editing.precioContado,
          precioLista: editing.precioLista,
          permitePagoUnico: editing.permitePagoUnico ?? true,
          permiteCuotas: editing.permiteCuotas,
        });
      } else {
        reset({
          sku: '',
          nombre: '',
          marca: '',
          proveedor: '',
          unidadMedida: 'UNIDAD',
          imagenUrl: '',
          descripcion: '',
          precioContado: 100,
          precioLista: 100,
          permitePagoUnico: true,
          permiteCuotas: true,
        });
      }
    }
  }, [open, editing, reset]);

  const rawImagenUrl = watch('imagenUrl');
  const trimmedImgUrl = rawImagenUrl?.trim() ?? '';
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  useEffect(() => {
    if (!open || !trimmedImgUrl) {
      setPreviewStatus('idle');
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmedImgUrl)) {
      setPreviewStatus('error');
      return;
    }
    setPreviewStatus('loading');
  }, [trimmedImgUrl, open]);

  const mutation = useMutation({
    mutationFn: async (values: ProductoFormValues) => {
      const payload = {
        sku: values.sku?.trim() || undefined,
        nombre: values.nombre.trim(),
        marca: values.marca?.trim() || undefined,
        proveedor: values.proveedor?.trim() || undefined,
        unidadMedida: values.unidadMedida?.trim() || undefined,
        imagenUrl: values.imagenUrl?.trim() || undefined,
        descripcion: values.descripcion?.trim() || undefined,
        precioContado: values.precioContado,
        precioLista: values.precioLista,
        permitePagoUnico: values.permitePagoUnico,
        permiteCuotas: values.permiteCuotas,
      };
      if (editing) {
        return productosApi.actualizar(editing.id, payload);
      }
      return productosApi.crear(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Producto actualizado en el catálogo' : 'Producto registrado en el catálogo');
      void queryClient.invalidateQueries({ queryKey: ['productos'] });
      onClose();
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={editing ? 'Editar producto o servicio' : 'Nuevo producto financiable'}
      subtitle="Configura precios al contado (Pc), precio de lista (PL) y modalidades de crédito sin control de stock."
      icon={<PackagePlus className="size-5" />}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <p className="text-xs text-[#64748b]">
            Sin bloqueo por inventario conforme al alcance del negocio.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="producto-form"
              loading={isSubmitting || mutation.isPending}
            >
              <Save className="size-4" />
              {editing ? 'Guardar cambios' : 'Registrar producto'}
            </Button>
          </div>
        </>
      }
    >
      <form
        id="producto-form"
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            label="Nombre del bien o servicio"
            htmlFor="prod-nombre"
            helpKey="producto.nombre"
            required
            error={errors.nombre?.message}
            className="sm:col-span-2"
          >
            <input
              id="prod-nombre"
              placeholder="Cocina a gas 2 hornillas Surge"
              className={inputBaseClass}
              {...register('nombre')}
            />
          </FormField>

          <FormField
            label="SKU (opcional)"
            htmlFor="prod-sku"
            helpKey="producto.sku"
            error={errors.sku?.message}
          >
            <input
              id="prod-sku"
              placeholder="Auto si queda vacío"
              className={inputBaseClass}
              {...register('sku')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Marca" htmlFor="prod-marca" helpKey="producto.marca">
            <input
              id="prod-marca"
              placeholder="Surge / Costeño"
              className={inputBaseClass}
              {...register('marca')}
            />
          </FormField>

          <FormField label="Proveedor" htmlFor="prod-proveedor" helpKey="producto.proveedor">
            <input
              id="prod-proveedor"
              placeholder="Distribuidora Central"
              className={inputBaseClass}
              {...register('proveedor')}
            />
          </FormField>

          <FormField
            label="Unidad de medida"
            htmlFor="prod-unidad"
            helpKey="producto.unidadMedida"
          >
            <input
              id="prod-unidad"
              placeholder="UNIDAD / SACO / PACK"
              className={inputBaseClass}
              {...register('unidadMedida')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Precio al Contado (Pc)"
            htmlFor="prod-pc"
            helpKey="producto.precioContado"
            required
            error={errors.precioContado?.message}
          >
            <input
              id="prod-pc"
              type="number"
              step="0.01"
              className={inputBaseClass}
              {...register('precioContado')}
            />
          </FormField>

          <FormField
            label="Precio de Lista / Crédito (PL)"
            htmlFor="prod-pl"
            helpKey="producto.precioLista"
            required
            error={errors.precioLista?.message}
          >
            <input
              id="prod-pl"
              type="number"
              step="0.01"
              className={inputBaseClass}
              {...register('precioLista')}
            />
          </FormField>
        </div>

        <FormField label="URL de imagen (opcional)" htmlFor="prod-img" helpKey="producto.imagenUrl">
          <input
            id="prod-img"
            placeholder="https://ejemplo.com/imagen.jpg"
            className={inputBaseClass}
            {...register('imagenUrl')}
          />
          {trimmedImgUrl && (
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#e6ebf0] bg-[#f8fafc] p-2.5">
              <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
                {previewStatus !== 'error' && (
                  <img
                    key={trimmedImgUrl}
                    src={trimmedImgUrl}
                    alt="Vista previa del producto"
                    onLoad={() => setPreviewStatus('loaded')}
                    onError={() => setPreviewStatus('error')}
                    className={previewStatus === 'loaded' ? 'size-full object-cover' : 'sr-only'}
                  />
                )}
                {previewStatus === 'error' && (
                  <ImageOff className="size-5 text-[#b45309]" aria-hidden="true" />
                )}
                {previewStatus === 'loading' && (
                  <span className="text-[10px] font-medium text-[#64748b]">...</span>
                )}
              </div>
              <div className="min-w-0 text-xs">
                {previewStatus === 'loaded' && (
                  <p className="flex items-center gap-1.5 font-medium text-[#00694d]">
                    <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
                    Vista previa cargada correctamente.
                  </p>
                )}
                {previewStatus === 'loading' && (
                  <p className="text-[#64748b]">Verificando enlace de imagen...</p>
                )}
                {previewStatus === 'error' && (
                  <p className="flex items-start gap-1.5 font-medium text-[#805200]">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-[#b45309]" aria-hidden="true" />
                    <span>Ingresa el enlace directo de una imagen (.jpg, .png, .webp)</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </FormField>

        <FormField
          label="Descripción comercial"
          htmlFor="prod-desc"
          helpKey="producto.descripcion"
        >
          <textarea
            id="prod-desc"
            rows={2}
            placeholder="Detalles del producto o servicio ofrecido..."
            className={inputBaseClass}
            {...register('descripcion')}
          />
        </FormField>

        <FormField
          label="Modalidades de financiamiento permitidas"
          helpKey="producto.modalidades"
          required
          error={errors.permiteCuotas?.message}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                className="size-4 accent-[#00694d]"
                {...register('permitePagoUnico')}
              />
              Pago Único (a fecha de pago)
            </label>
            <label className="flex items-center gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                className="size-4 accent-[#00694d]"
                {...register('permiteCuotas')}
              />
              Cuotas mensuales (Francés)
            </label>
          </div>
        </FormField>
      </form>
    </ModalDialog>
  );
}
