import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  Printer,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { clientesApi, creditosApi, pagosApi } from '@/api/endpoints';
import { useAuth } from '@/context/AuthContext';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, inputBaseClass } from '@/components/ui/FormField';
import { PageLoader } from '@/components/ui/EmptyState';
import {
  formatDatePE,
  formatMoney,
  formatPercentFromDecimal,
  todayISO,
} from '@/utils/formatters';

export function ClientPortalPage({
  initialSection = 'resumen',
}: {
  initialSection?: 'resumen' | 'estado-cuenta' | 'creditos';
}) {
  const { user, cliente: authCliente } = useAuth();
  const clienteId = user?.clienteId ?? authCliente?.id;
  const [fCorte, setFCorte] = useState<string>(() => todayISO());
  const [expandedCreditId, setExpandedCreditId] = useState<string | null>(null);

  const { data: cliente, isLoading: loadingCli } = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: () => clientesApi.obtenerPorId(clienteId!),
    enabled: Boolean(clienteId),
  });

  const { data: estadoCuenta, isLoading: loadingEC } = useQuery({
    queryKey: ['estadoCuenta', clienteId, fCorte],
    queryFn: () => clientesApi.estadoCuenta(clienteId!, fCorte),
    enabled: Boolean(clienteId),
  });

  const { data: creditos = [], isLoading: loadingCred } = useQuery({
    queryKey: ['creditos', 'cliente', clienteId],
    queryFn: creditosApi.listar,
    enabled: Boolean(clienteId),
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos', 'cliente', clienteId],
    queryFn: () => pagosApi.listarPorCliente(clienteId!),
    enabled: Boolean(clienteId),
  });

  const { data: expandedDetail } = useQuery({
    queryKey: ['credito', expandedCreditId],
    queryFn: () => creditosApi.obtenerPorId(expandedCreditId!),
    enabled: Boolean(expandedCreditId),
  });

  if (loadingCli || loadingEC || loadingCred || !cliente) {
    return <PageLoader label="Cargando tu portal de vecino..." />;
  }

  // Defensive frontend filter in addition to backend enforcement
  const misCreditos = creditos.filter((c) => c.clienteId === cliente.id);
  const lineaDisponible =
    estadoCuenta?.cliente.lineaDisponible ?? cliente.limiteCredito - cliente.capitalVigente;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
            Portal del Vecino · Solo Consulta
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">
            Hola, {cliente.nombreCompleto}
          </h1>
          <p className="text-sm text-[#64748b]">
            {cliente.tipoDoc} {cliente.numDoc} · Día de corte: {cliente.diaCorte} · Día de pago:{' '}
            {cliente.diaPago}
          </p>
        </div>

        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir Estado de Cuenta (PDF)
        </Button>
      </div>

      {/* Credit Line Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-[#0b3c5d] to-[#00694d] text-white border-none">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
              Cupo Disponible
            </p>
            <Wallet className="size-5 text-[#65dbaf]" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {formatMoney(lineaDisponible, cliente.moneda)}
          </p>
          <p className="mt-1 text-xs text-[#a7f3d0]">
            Línea aprobada: {formatMoney(cliente.limiteCredito, cliente.moneda)}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Capital Utilizado (Kv)
          </p>
          <p className="mt-2 text-2xl font-bold text-[#121d26] tabular-nums">
            {formatMoney(cliente.capitalVigente, cliente.moneda)}
          </p>
          <p className="mt-1 text-xs text-[#64748b]">
            Tasa pactada: {cliente.tipoTasa} {formatPercentFromDecimal(cliente.tasa)}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Total Exigible al {formatDatePE(fCorte)}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#00694d] tabular-nums">
            {formatMoney(estadoCuenta?.resumenLiquidacion.totalExigibleHoy ?? 0, cliente.moneda)}
          </p>
          <p className="mt-1 text-xs text-[#805200]">
            Mora acumulada:{' '}
            {formatMoney(estadoCuenta?.resumenLiquidacion.totalInteresMoratorio ?? 0, cliente.moneda)}
          </p>
        </Card>
      </div>

      {/* Estado de Cuenta Section */}
      {(initialSection === 'resumen' || initialSection === 'estado-cuenta') && estadoCuenta && (
        <Card className="print-area p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e6ebf0] pb-4">
            <div className="flex items-center gap-2.5">
              <FileText className="size-5 text-[#00694d]" />
              <div>
                <h2 className="text-lg font-bold text-[#0b3c5d]">
                  Estado de Cuenta del Ciclo Actual
                </h2>
                <p className="text-xs text-[#64748b]">
                  Corte: {formatDatePE(estadoCuenta.ciclo.fechaCorte)} · Pago oportuno:{' '}
                  {formatDatePE(estadoCuenta.ciclo.fechaPagoOportuno)}
                </p>
              </div>
            </div>

            <div className="no-print w-full sm:w-60">
              <FormField label="Fecha de consulta" htmlFor="cli-fc" helpKey="estadoCuenta.fCorte">
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
                  <input
                    id="cli-fc"
                    type="date"
                    value={fCorte}
                    onChange={(e) => setFCorte(e.target.value)}
                    className={`${inputBaseClass} pl-9`}
                  />
                </div>
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-xl bg-[#f4f7fa] p-4 text-xs">
            <div>
              <p className="text-[#64748b]">Capital ciclo</p>
              <p className="mt-0.5 font-bold tabular-nums">
                {formatMoney(estadoCuenta.resumenLiquidacion.totalCapitalCiclo, cliente.moneda)}
              </p>
            </div>
            <div>
              <p className="text-[#64748b]">Int. Compensatorio</p>
              <p className="mt-0.5 font-bold tabular-nums">
                {formatMoney(estadoCuenta.resumenLiquidacion.totalInteresCiclo, cliente.moneda)}
              </p>
            </div>
            <div>
              <p className="text-[#64748b]">Vencido anterior</p>
              <p className="mt-0.5 font-bold tabular-nums">
                {formatMoney(
                  estadoCuenta.resumenLiquidacion.totalDeudaVencidaAnterior,
                  cliente.moneda
                )}
              </p>
            </div>
            <div>
              <p className="text-[#805200] font-semibold">Mora (ítem separado)</p>
              <p className="mt-0.5 font-bold text-[#805200] tabular-nums">
                +{formatMoney(estadoCuenta.resumenLiquidacion.totalInteresMoratorio, cliente.moneda)}
              </p>
            </div>
            <div>
              <p className="text-[#00694d] font-bold">Total Exigible Hoy</p>
              <p className="mt-0.5 text-base font-bold text-[#00694d] tabular-nums">
                {formatMoney(estadoCuenta.resumenLiquidacion.totalExigibleHoy, cliente.moneda)}
              </p>
            </div>
          </div>

          {estadoCuenta.cuotasVencidasAnteriores.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#ba1a1a]">
                <AlertTriangle className="size-4" />
                Cuotas Vencidas Anteriores
              </p>
              <SimpleScheduleTable
                rows={estadoCuenta.cuotasVencidasAnteriores}
                moneda={cliente.moneda}
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold text-[#0b3c5d]">
              Cuotas del Ciclo Actual ({estadoCuenta.cuotasCicloActual.length})
            </p>
            {estadoCuenta.cuotasCicloActual.length === 0 ? (
              <p className="rounded-xl bg-[#f8fafc] p-4 text-xs text-[#64748b]">
                No tienes cuotas exigibles en el ciclo actual al {formatDatePE(fCorte)}.
              </p>
            ) : (
              <SimpleScheduleTable rows={estadoCuenta.cuotasCicloActual} moneda={cliente.moneda} />
            )}
          </div>
        </Card>
      )}

      {/* Mis Créditos y Cronogramas */}
      {(initialSection === 'resumen' || initialSection === 'creditos') && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#e6ebf0] pb-3">
            <CreditCard className="size-5 text-[#0b3c5d]" />
            <h2 className="text-lg font-bold text-[#0b3c5d]">
              Mis Créditos y Cronogramas ({misCreditos.length})
            </h2>
          </div>

          <div className="space-y-3">
            {misCreditos.map((cr) => {
              const isExpanded = expandedCreditId === cr.id;
              return (
                <div key={cr.id} className="rounded-xl border border-[#e6ebf0] overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f8fafc] p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#121d26]">
                          Crédito {cr.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Badge variant={cr.estado === 'Cancelado' ? 'emerald' : 'navy'}>
                          {cr.estado}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#64748b]">
                        Emitido: {formatDatePE(cr.fechaEmision)} · {cr.modalidad} ({cr.plazoMeses}{' '}
                        cuota/s) · TCEA {(cr.tcea * 100).toFixed(2)}%
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-[#64748b]">PL / Cuota</p>
                        <p className="font-bold text-[#00694d] tabular-nums">
                          {formatMoney(cr.precioLista, cr.moneda)} ·{' '}
                          {formatMoney(cr.cuota, cr.moneda)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedCreditId(isExpanded ? null : cr.id)}
                      >
                        {isExpanded ? (
                          <>
                            Ocultar <ChevronUp className="size-3.5" />
                          </>
                        ) : (
                          <>
                            Ver cronograma <ChevronDown className="size-3.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && expandedDetail?.credito.id === cr.id && (
                    <div className="table-region border-t border-[#e6ebf0]" role="region" tabIndex={0}>
                      <table>
                        <thead className="bg-white text-left text-[11px] font-bold uppercase text-[#64748b]">
                          <tr>
                            <th className="px-4 py-2.5">Cuota</th>
                            <th className="px-4 py-2.5">Vencimiento</th>
                            <th className="px-4 py-2.5 text-right">Capital</th>
                            <th className="px-4 py-2.5 text-right">Interés</th>
                            <th className="px-4 py-2.5 text-right">Cuota</th>
                            <th className="px-4 py-2.5">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6ebf0] text-xs">
                          {expandedDetail.cuotas.map((cu) => (
                            <tr key={cu.id}>
                              <td className="px-4 py-2.5 font-semibold">#{cu.numero}</td>
                              <td className="px-4 py-2.5 tabular-nums">
                                {formatDatePE(cu.fechaVencimiento)}
                              </td>
                              <td className="px-4 py-2.5 text-right tabular-nums">
                                {formatMoney(cu.amortizacion, cr.moneda)}
                              </td>
                              <td className="px-4 py-2.5 text-right tabular-nums">
                                {formatMoney(cu.interes, cr.moneda)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                                {formatMoney(cu.cuota, cr.moneda)}
                              </td>
                              <td className="px-4 py-2.5">
                                <Badge variant={cu.estado === 'Pagada' ? 'emerald' : 'amber'}>
                                  {cu.estado}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            {misCreditos.length === 0 && (
              <p className="py-6 text-center text-sm text-[#64748b]">
                Aún no tienes créditos registrados.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Historial de Pagos */}
      {pagos.length > 0 && (
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Receipt className="size-5 text-[#00694d]" />
            <h2 className="text-base font-bold text-[#0b3c5d]">Historial de Pagos</h2>
          </div>
          <div className="table-region" role="region" tabIndex={0}>
            <table>
              <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase text-[#64748b]">
                <tr>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5">Método</th>
                  <th className="px-4 py-2.5 text-right">Mora</th>
                  <th className="px-4 py-2.5 text-right">Compensatorio</th>
                  <th className="px-4 py-2.5 text-right">Capital</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf0] text-xs">
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 tabular-nums">{formatDatePE(p.fechaPago)}</td>
                    <td className="px-4 py-2.5">{p.metodoPago || 'EFECTIVO'}</td>
                    <td className="px-4 py-2.5 text-right text-[#805200] tabular-nums">
                      {formatMoney(p.interesMoratorio, cliente.moneda)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatMoney(p.interesCompensatorio, cliente.moneda)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-[#00694d] tabular-nums">
                      {formatMoney(p.amortizacionCapital, cliente.moneda)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                      {formatMoney(p.montoPagado, cliente.moneda)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-[#64748b]">
        <ShieldCheck className="size-4 text-[#00694d]" />
        <span>
          Basado en buenas prácticas financieras y estándares de transparencia (referencia
          metodológica BCRP / SBS y Ley N.° 31143).
        </span>
      </div>
    </div>
  );
}

function SimpleScheduleTable({
  rows,
  moneda,
}: {
  rows: Array<{
    cuotaId: string;
    numeroCuota: number;
    fechaVencimiento: string;
    amortizacion: number;
    interesCompensatorio: number;
    diasMora: number;
    interesMoratorio: number;
    totalExigible: number;
    estado: string;
  }>;
  moneda: string;
}) {
  return (
    <div className="table-region rounded-xl border border-[#e6ebf0]" role="region" tabIndex={0}>
      <table>
        <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase text-[#64748b]">
          <tr>
            <th className="px-4 py-2.5">Cuota</th>
            <th className="px-4 py-2.5">Vencimiento</th>
            <th className="px-4 py-2.5 text-right">Capital</th>
            <th className="px-4 py-2.5 text-right">Int. Comp.</th>
            <th className="px-4 py-2.5 text-right">Mora</th>
            <th className="px-4 py-2.5 text-right">Total Exigible</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e6ebf0] text-xs">
          {rows.map((r) => (
            <tr key={r.cuotaId}>
              <td className="px-4 py-2.5 font-semibold">
                Cuota #{r.numeroCuota}{' '}
                <Badge variant={r.estado === 'Vencida' ? 'red' : 'amber'}>{r.estado}</Badge>
              </td>
              <td className="px-4 py-2.5 tabular-nums">{formatDatePE(r.fechaVencimiento)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatMoney(r.amortizacion, moneda)}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatMoney(r.interesCompensatorio, moneda)}
              </td>
              <td className="px-4 py-2.5 text-right text-[#805200] tabular-nums">
                {r.diasMora > 0
                  ? `+${formatMoney(r.interesMoratorio, moneda)} (${r.diasMora}d)`
                  : '—'}
              </td>
              <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                {formatMoney(r.totalExigible, moneda)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
