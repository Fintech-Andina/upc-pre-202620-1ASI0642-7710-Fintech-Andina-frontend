import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Calculator, CheckCircle2, Scale, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { creditosApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import type { ModalidadCredito, Moneda, SimularCreditoOutput, TipoTasa } from '@/types/api';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, inputBaseClass } from '@/components/ui/FormField';
import { BCRP_LIMITS_REF, formatDatePE, formatMoney, todayISO } from '@/utils/formatters';

export function ReglasFinanciamientoPage() {
  const [precioLista, setPrecioLista] = useState(1500);
  const [moneda, setMoneda] = useState<Moneda>('PEN');
  const [tipoTasa, setTipoTasa] = useState<TipoTasa>('Nominal');
  const [tasaPct, setTasaPct] = useState(36);
  const [capitalizacion, setCapitalizacion] = useState(12);
  const [modalidad, setModalidad] = useState<ModalidadCredito>('Cuotas');
  const [plazoMeses, setPlazoMeses] = useState(6);
  const [diaCorte, setDiaCorte] = useState(15);
  const [diaPago, setDiaPago] = useState(25);
  const [fCompra, setFCompra] = useState(() => todayISO());
  const [simResult, setSimResult] = useState<SimularCreditoOutput | null>(null);

  const simMutation = useMutation({
    mutationFn: () =>
      creditosApi.simular({
        precioLista,
        precioContado: precioLista,
        moneda,
        tipoTasa,
        tasa: tasaPct / 100,
        capitalizacion,
        modalidad,
        plazoMeses: modalidad === 'PagoUnico' ? 1 : plazoMeses,
        fCompra,
        diaCorte,
        diaPago,
      }),
    onSuccess: (data) => setSimResult(data),
    onError: (err) => toast.error(extractApiErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
          Parámetros del Motor Financiero
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">
          Reglas de Financiamiento y Buenas Prácticas
        </h1>
        <p className="mt-0.5 text-sm text-[#64748b]">
          Basado en buenas prácticas financieras y estándares de transparencia (referencia
          metodológica BCRP / SBS y Ley N.° 31143).
        </p>
      </div>

      {/* BCRP Limits Cards (Exact backend values: PEN 100/50, USD 80/40) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 space-y-3 border-l-4 border-l-[#0f9d75]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0b3c5d]">Topes Referenciales BCRP — Soles (PEN)</h2>
            <Badge variant="emerald">Moneda Nacional</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[#f4f7fa] p-3">
              <p className="text-xs text-[#64748b]">TEA Compensatoria Máxima</p>
              <p className="text-xl font-bold text-[#00694d] tabular-nums">
                {BCRP_LIMITS_REF.PEN.compensatorioMaxPct}.00%
              </p>
            </div>
            <div className="rounded-xl bg-[#fffbeb] p-3">
              <p className="text-xs text-[#805200]">TEA Moratoria Máxima</p>
              <p className="text-xl font-bold text-[#805200] tabular-nums">
                {BCRP_LIMITS_REF.PEN.moratorioMaxPct}.00%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3 border-l-4 border-l-[#0b3c5d]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0b3c5d]">Topes Referenciales BCRP — Dólares (USD)</h2>
            <Badge variant="navy">Moneda Extranjera</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[#f4f7fa] p-3">
              <p className="text-xs text-[#64748b]">TEA Compensatoria Máxima</p>
              <p className="text-xl font-bold text-[#0b3c5d] tabular-nums">
                {BCRP_LIMITS_REF.USD.compensatorioMaxPct}.00%
              </p>
            </div>
            <div className="rounded-xl bg-[#fffbeb] p-3">
              <p className="text-xs text-[#805200]">TEA Moratoria Máxima</p>
              <p className="text-xl font-bold text-[#805200] tabular-nums">
                {BCRP_LIMITS_REF.USD.moratorioMaxPct}.00%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Conventions + Live Simulator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <Card className="xl:col-span-5 p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#0b3c5d]">
            <Scale className="size-5 text-[#0f9d75]" />
            <h2 className="text-base font-bold">Convenciones Fijas del Motor (F-1 a F-17)</h2>
          </div>
          <ul className="space-y-2.5 text-xs text-[#3d4a43]">
            {[
              'Año comercial base de 360 días y mes comercial homogéneo de 30 días.',
              'Redondeo comercial formal a 2 decimales (R2) con ajuste de saldo final a 0.00 en la cuota n.',
              'Período de gracia total g capitalizado al inicio: P\' = PL × (1 + TEA)^(g / 360).',
              'Control estricto de línea de crédito al emitir: Capital Vigente (Kv) + PL <= L.',
              'Mora independiente sin anatocismo: IM = Cuota × [(1 + TEAm)^(dm / 360) - 1].',
              'Rechazo estricto de pagos parciales e imputación legal: 1° Mora → 2° Compensatorio → 3° Capital.',
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-[#0f9d75] mt-0.5" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl bg-[#edf4ff] p-3.5 text-xs text-[#3d4a43] flex items-start gap-2.5">
            <ShieldCheck className="size-4 shrink-0 text-[#0b3c5d] mt-0.5" />
            <span>
              Todas las simulaciones de este módulo consultan directamente al servidor backend
              mediante <code className="font-mono font-semibold">POST /api/creditos/simular</code>.
            </span>
          </div>
        </Card>

        <Card className="xl:col-span-7 p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 border-b border-[#e6ebf0] pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="size-5 text-[#00694d]" />
              <h2 className="text-base font-bold text-[#0b3c5d]">
                Simulador Rápido (Cálculo en Servidor)
              </h2>
            </div>
            <Badge variant="emerald">Sin persistir</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Monto (PL)" htmlFor="sim-pl" helpKey="wizard.precioLista" required>
              <input
                id="sim-pl"
                type="number"
                value={precioLista}
                onChange={(e) => setPrecioLista(Number(e.target.value))}
                className={inputBaseClass}
              />
            </FormField>

            <FormField label="Moneda" htmlFor="sim-mon" helpKey="cliente.moneda" required>
              <select
                id="sim-mon"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as Moneda)}
                className={inputBaseClass}
              >
                <option value="PEN">PEN (S/)</option>
                <option value="USD">USD (US$)</option>
              </select>
            </FormField>

            <FormField label="Modalidad" htmlFor="sim-mod" helpKey="wizard.modalidad" required>
              <select
                id="sim-mod"
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as ModalidadCredito)}
                className={inputBaseClass}
              >
                <option value="Cuotas">Cuotas (Francés)</option>
                <option value="PagoUnico">Pago Único</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <FormField label="Tipo de tasa" htmlFor="sim-tt" helpKey="cliente.tipoTasa" required>
              <select
                id="sim-tt"
                value={tipoTasa}
                onChange={(e) => setTipoTasa(e.target.value as TipoTasa)}
                className={inputBaseClass}
              >
                <option value="Nominal">Nominal (TNA)</option>
                <option value="Efectiva">Efectiva (TEA)</option>
              </select>
            </FormField>

            <FormField label="Tasa (%)" htmlFor="sim-tasa" helpKey="cliente.tasa" required>
              <input
                id="sim-tasa"
                type="number"
                step="0.01"
                value={tasaPct}
                onChange={(e) => setTasaPct(Number(e.target.value))}
                className={inputBaseClass}
              />
            </FormField>

            <FormField
              label="Cap. (m)"
              htmlFor="sim-cap"
              helpKey="cliente.capitalizacion"
              required
            >
              <select
                id="sim-cap"
                value={capitalizacion}
                disabled={tipoTasa === 'Efectiva'}
                onChange={(e) => setCapitalizacion(Number(e.target.value))}
                className={inputBaseClass}
              >
                <option value={12}>12 (Mensual)</option>
                <option value={360}>360 (Diaria)</option>
              </select>
            </FormField>

            <FormField label="Plazo (meses)" htmlFor="sim-plazo" helpKey="wizard.plazoMeses" required>
              <input
                id="sim-plazo"
                type="number"
                min={1}
                disabled={modalidad === 'PagoUnico'}
                value={modalidad === 'PagoUnico' ? 1 : plazoMeses}
                onChange={(e) => setPlazoMeses(Number(e.target.value))}
                className={inputBaseClass}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Fecha compra" htmlFor="sim-fc" helpKey="wizard.fCompra" required>
              <input
                id="sim-fc"
                type="date"
                value={fCompra}
                onChange={(e) => setFCompra(e.target.value)}
                className={inputBaseClass}
              />
            </FormField>
            <FormField label="Día corte (1-28)" htmlFor="sim-dc" helpKey="cliente.diaCorte" required>
              <input
                id="sim-dc"
                type="number"
                min={1}
                max={28}
                value={diaCorte}
                onChange={(e) => setDiaCorte(Number(e.target.value))}
                className={inputBaseClass}
              />
            </FormField>
            <FormField label="Día pago (1-28)" htmlFor="sim-dp" helpKey="cliente.diaPago" required>
              <input
                id="sim-dp"
                type="number"
                min={1}
                max={28}
                value={diaPago}
                onChange={(e) => setDiaPago(Number(e.target.value))}
                className={inputBaseClass}
              />
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => simMutation.mutate()} loading={simMutation.isPending}>
              <Calculator className="size-4" />
              Calcular en el Motor Financiero
            </Button>
          </div>

          {simResult && (
            <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5]/50 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-[#64748b]">Gracia total (g)</p>
                  <p className="text-base font-bold text-[#121d26]">{simResult.diasGracia} días</p>
                </div>
                <div>
                  <p className="text-[#64748b]">Capitalizado (P&apos;)</p>
                  <p className="text-base font-bold text-[#121d26] tabular-nums">
                    {formatMoney(simResult.capitalCapitalizado, simResult.moneda)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b]">Cuota Ref. (R)</p>
                  <p className="text-base font-bold text-[#00694d] tabular-nums">
                    {formatMoney(simResult.cuotaReferencial, simResult.moneda)}
                  </p>
                </div>
                <div>
                  <p className="text-[#64748b]">TCEA / TREA</p>
                  <p className="text-base font-bold text-[#0b3c5d] tabular-nums">
                    {(simResult.tcea * 100).toFixed(4)}%
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-[#3d4a43]">
                Corte: <strong>{formatDatePE(simResult.fechaCorte)}</strong> · 1er pago:{' '}
                <strong>{formatDatePE(simResult.primeraFechaPago)}</strong> · Total a pagar:{' '}
                <strong>{formatMoney(simResult.totalPagar, simResult.moneda)}</strong>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
