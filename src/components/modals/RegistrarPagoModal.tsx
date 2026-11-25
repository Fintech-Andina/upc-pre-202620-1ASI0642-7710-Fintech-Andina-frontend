import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Banknote,
  Calendar,
  CheckCircle2,
  Landmark,
  QrCode,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { pagosApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import type { Cliente, Credito, Cuota } from '@/types/api';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, inputBaseClass } from '@/components/ui/FormField';
import { formatDatePE, formatMoney, formatPercentFromDecimal, todayISO } from '@/utils/formatters';

interface RegistrarPagoModalProps {
  open: boolean;
  onClose: () => void;
  credito: Credito;
  cuota: Cuota | null;
  cliente?: Cliente | null;
}

const METODOS = [
  { id: 'EFECTIVO', label: 'Efectivo', icon: <Banknote className="size-4" /> },
  { id: 'YAPE', label: 'Yape', icon: <QrCode className="size-4" /> },
  { id: 'PLIN', label: 'Plin', icon: <Smartphone className="size-4" /> },
  { id: 'TRANSFERENCIA', label: 'Transferencia', icon: <Landmark className="size-4" /> },
];

export function RegistrarPagoModal({
  open,
  onClose,
  credito,
  cuota,
  cliente,
}: RegistrarPagoModalProps) {
  const queryClient = useQueryClient();
  const [fPago, setFPago] = useState<string>(() => todayISO());
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [referencia, setReferencia] = useState<string>('');
  const [montoRecibido, setMontoRecibido] = useState<string>('');

  useEffect(() => {
    if (open && cuota) {
      setFPago(todayISO());
      setMetodoPago('EFECTIVO');
      setReferencia('');
    }
  }, [open, cuota]);

  // Exact backend preview of mora & imputation (ZERO frontend formulas)
  const {
    data: preview,
    isFetching: loadingPreview,
    error: previewError,
  } = useQuery({
    queryKey: ['pagoPreview', credito.clienteId, cuota?.id, fPago],
    queryFn: () =>
      pagosApi.previsualizar({
        clienteId: credito.clienteId,
        cuotaIds: cuota ? [cuota.id] : undefined,
        fPago,
      }),
    enabled: open && Boolean(cuota) && Boolean(fPago),
  });

  useEffect(() => {
    if (preview) {
      setMontoRecibido(preview.totalExigible.toFixed(2));
    }
  }, [preview]);

  const liquidarMutation = useMutation({
    mutationFn: () => {
      if (!cuota || !preview) throw new Error('Sin cuota seleccionada');
      return pagosApi.liquidar({
        clienteId: credito.clienteId,
        cuotaIds: [cuota.id],
        fPago,
        montoRecibido: Number(montoRecibido),
        metodoPago,
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Pago liquidado (${formatMoney(res.pagoRegistrado.totalPagado, credito.moneda)}). Imputación: Mora ${formatMoney(res.imputacionLegal.moratorio, credito.moneda)} · Comp. ${formatMoney(res.imputacionLegal.compensatorio, credito.moneda)} · Capital ${formatMoney(res.imputacionLegal.capital, credito.moneda)}`
      );
      void queryClient.invalidateQueries({ queryKey: ['credito', credito.id] });
      void queryClient.invalidateQueries({ queryKey: ['creditos'] });
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
      void queryClient.invalidateQueries({ queryKey: ['cliente', credito.clienteId] });
      void queryClient.invalidateQueries({ queryKey: ['estadoCuenta'] });
      void queryClient.invalidateQueries({ queryKey: ['pagos'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });

  if (!cuota) return null;

  const numericMonto = Number(montoRecibido);
  const totalExigible = preview?.totalExigible ?? cuota.cuota;
  const isPartial =
    Boolean(preview) && (!Number.isFinite(numericMonto) || numericMonto + 1e-9 < totalExigible);

  const fila = preview?.filas[0];
  const diasMora = fila?.diasMora ?? 0;

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={`Registrar pago · Cuota ${cuota.numero} de ${credito.plazoMeses}`}
      subtitle={`${cliente?.nombreCompleto ?? 'Cliente'} · Vencimiento ${formatDatePE(cuota.fechaVencimiento)}`}
      icon={<Banknote className="size-5" />}
      badge={<Badge variant="emerald">EN CAJA</Badge>}
      maxWidthClass="max-w-4xl"
      footer={
        <>
          <div className="text-xs text-[#3d4a43]">
            Prelación legal automática: <strong>1° Mora → 2° Compensatorio → 3° Capital</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={loadingPreview || !preview || isPartial}
              loading={liquidarMutation.isPending}
              onClick={() => liquidarMutation.mutate()}
            >
              <CheckCircle2 className="size-4" />
              Confirmar pago ({formatMoney(totalExigible, credito.moneda)})
            </Button>
          </div>
        </>
      }
    >
      <div className="space-y-5">
        {/* Simulation Preset Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#e4effd] p-2.5">
          <span className="px-2 text-[11px] font-bold uppercase tracking-wider text-[#3d4a43]">
            Simulación de fecha de pago en servidor:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setFPago(cuota.fechaVencimiento)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                fPago === cuota.fechaVencimiento
                  ? 'bg-[#00694d] text-white'
                  : 'text-[#3d4a43] hover:bg-slate-100'
              }`}
            >
              A tiempo ({formatDatePE(cuota.fechaVencimiento)})
            </button>
            <button
              type="button"
              onClick={() => setFPago(todayISO())}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                fPago === todayISO()
                  ? 'bg-[#00694d] text-white'
                  : 'text-[#3d4a43] hover:bg-slate-100'
              }`}
            >
              Hoy ({formatDatePE(todayISO())})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: Form */}
          <div className="lg:col-span-7 space-y-4">
            <FormField
              label="Fecha efectiva del pago"
              htmlFor="pago-fecha"
              helpKey="pago.fPago"
              required
            >
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
                <input
                  id="pago-fecha"
                  type="date"
                  value={fPago}
                  onChange={(e) => setFPago(e.target.value)}
                  className={`${inputBaseClass} pl-10 bg-[#edf4ff]`}
                />
              </div>
            </FormField>

            <FormField label="Método de pago recibido" helpKey="pago.metodoPago" required>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {METODOS.map((m) => {
                  const active = metodoPago === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodoPago(m.id)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 px-2 text-xs font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#00694d] text-white shadow-md ring-2 ring-[#00694d]'
                          : 'bg-[#edf4ff] text-[#121d26] hover:bg-[#e4effd]'
                      }`}
                    >
                      {m.icon}
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormField>

            <FormField
              label="N.° de Operación / Referencia (opcional)"
              htmlFor="pago-ref"
              helpKey="pago.referencia"
            >
              <input
                id="pago-ref"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej. Op. 948201"
                className={`${inputBaseClass} bg-[#edf4ff]`}
              />
            </FormField>

            <FormField
              label="Monto total recibido en caja"
              htmlFor="pago-monto"
              helpKey="pago.montoRecibido"
              required
              rightSlot={
                preview && !isPartial ? (
                  <Badge variant="emerald">Monto exacto exigible</Badge>
                ) : null
              }
            >
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-bold text-[#121d26]">
                  {credito.moneda === 'USD' ? 'US$' : 'S/'}
                </span>
                <input
                  id="pago-monto"
                  type="number"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className={`${inputBaseClass} pl-11 pr-24 py-3 text-xl font-bold text-[#00694d] bg-[#edf4ff] tabular-nums`}
                />
                {preview && (
                  <button
                    type="button"
                    onClick={() => setMontoRecibido(preview.totalExigible.toFixed(2))}
                    className="absolute right-2 rounded-lg bg-[#e4effd] px-2.5 py-1.5 text-xs font-semibold text-[#121d26] hover:bg-[#d2e4fb] cursor-pointer"
                  >
                    Cuadrar
                  </button>
                )}
              </div>
            </FormField>

            {isPartial && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-[#fecaca] bg-[#ffdad6] p-3 text-xs font-semibold text-[#93000a]"
              >
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>
                  No se admiten pagos parciales. El monto recibido debe ser al menos{' '}
                  <strong>{formatMoney(totalExigible, credito.moneda)}</strong> (Cuota base + Mora).
                </span>
              </div>
            )}

            {previewError && (
              <div className="rounded-xl bg-[#ffdad6] p-3 text-xs font-semibold text-[#93000a]">
                {extractApiErrorMessage(previewError)}
              </div>
            )}
          </div>

          {/* RIGHT 5 COLS: Server Liquidation Breakdown & Imputation Order */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-[#edf4ff]/90 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#dce6f5] pb-2">
                <h2 className="text-sm font-bold text-[#121d26]">Liquidación de Cuota</h2>
                <Badge variant="navy">Motor Backend</Badge>
              </div>

              {loadingPreview || !preview ? (
                <p className="py-6 text-center text-xs text-[#64748b]">
                  Calculando liquidación exacta...
                </p>
              ) : (
                <>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#3d4a43]">Cuota programada base (T):</span>
                      <strong className="text-sm text-[#121d26] tabular-nums">
                        {formatMoney(preview.totalExigibleBase, preview.moneda)}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#3d4a43]">Días de atraso (dm):</span>
                      <Badge variant={diasMora > 0 ? 'amber' : 'emerald'}>
                        {diasMora > 0 ? `${diasMora} días de mora` : 'Sin mora (0 días)'}
                      </Badge>
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <p className="text-[#3d4a43]">Interés moratorio (IM)</p>
                        <p className="text-[11px] text-[#64748b]">
                          TEAm {formatPercentFromDecimal(preview.teaMora)} sin anatocismo
                        </p>
                      </div>
                      <strong className="text-sm text-[#805200] tabular-nums">
                        +{formatMoney(preview.totalInteresMoratorio, preview.moneda)}
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3.5 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#3d4a43]">
                        TOTAL EXIGIBLE (T + IM)
                      </p>
                      <p className="text-[11px] font-medium text-[#00694d]">
                        Cancela íntegramente la cuota
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-[#00694d] tabular-nums">
                      {formatMoney(preview.totalExigible, preview.moneda)}
                    </p>
                  </div>

                  {/* Legal Imputation Order */}
                  <div className="rounded-xl border border-[#dce6f5] bg-white p-3 space-y-1.5 text-[11.5px]">
                    <p className="font-bold text-[#0b3c5d]">
                      Orden Estricto de Imputación (Prelación):
                    </p>
                    <div className="flex justify-between text-[#805200]">
                      <span>1° Interés Moratorio:</span>
                      <strong className="tabular-nums">
                        {formatMoney(preview.imputacionEstimada.moratorio, preview.moneda)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#3d4a43]">
                      <span>2° Interés Compensatorio:</span>
                      <strong className="tabular-nums">
                        {formatMoney(preview.imputacionEstimada.compensatorio, preview.moneda)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-[#00694d]">
                      <span>3° Amortización Capital:</span>
                      <strong className="tabular-nums">
                        {formatMoney(preview.imputacionEstimada.capital, preview.moneda)}
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#e4effd] p-3 text-[11px] text-[#3d4a43] flex items-start gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-[#0b3c5d] mt-0.5" />
                    <span>
                      Basado en buenas prácticas financieras y estándares de transparencia
                      (referencia metodológica BCRP / SBS y Ley N.° 31143). Sin capitalización de mora.
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
