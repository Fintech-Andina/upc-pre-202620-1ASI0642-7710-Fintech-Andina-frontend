import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Edit,
  FileText,
  Plus,
  Printer,
  Receipt,
  User,
} from 'lucide-react';
import { clientesApi, creditosApi, pagosApi } from '@/api/endpoints';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, inputBaseClass } from '@/components/ui/FormField';
import { PageLoader } from '@/components/ui/EmptyState';
import {
  formatDatePE,
  formatMoney,
  formatPercentFromDecimal,
  getInitials,
  todayISO,
} from '@/utils/formatters';

type TabKey = 'estadoCuenta' | 'creditos' | 'pagos' | 'datos';

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('estadoCuenta');
  const [fCorte, setFCorte] = useState<string>(() => todayISO());

  const { data: cliente, isLoading: loadingCli } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesApi.obtenerPorId(id!),
    enabled: Boolean(id),
  });

  const { data: estadoCuenta, isLoading: loadingEC } = useQuery({
    queryKey: ['estadoCuenta', id, fCorte],
    queryFn: () => clientesApi.estadoCuenta(id!, fCorte),
    enabled: Boolean(id),
  });

  const { data: allCreditos = [] } = useQuery({
    queryKey: ['creditos'],
    queryFn: creditosApi.listar,
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['pagos', 'cliente', id],
    queryFn: () => pagosApi.listarPorCliente(id!),
    enabled: Boolean(id),
  });

  if (loadingCli || !cliente) {
    return <PageLoader label="Cargando expediente del cliente..." />;
  }

  const clientCreditos = allCreditos.filter((c) => c.clienteId === cliente.id);
  const lineaDisponible = estadoCuenta?.cliente.lineaDisponible ?? cliente.limiteCredito - cliente.capitalVigente;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/clientes')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b3c5d] hover:text-[#00694d] cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Volver a clientes
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir / Guardar PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(`/clientes/${cliente.id}/editar`)}
          >
            <Edit className="size-4" />
            Editar
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/creditos/nuevo?clienteId=${cliente.id}`)}
          >
            <Plus className="size-4" />
            Nuevo crédito
          </Button>
        </div>
      </div>

      {/* Client Identity Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf4ff] text-lg font-bold text-[#0b3c5d]">
              {getInitials(cliente.nombreCompleto)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#121d26]">
                  {cliente.nombreCompleto}
                </h1>
                <Badge variant={cliente.activo ? 'emerald' : 'slate'}>
                  {cliente.activo ? 'Activo' : 'Inactivo'}
                </Badge>
                <Badge variant="navy">{cliente.moneda}</Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#64748b]">
                {cliente.tipoDoc} {cliente.numDoc}
                {cliente.telefono ? ` · ${cliente.telefono}` : ''}
                {cliente.direccion ? ` · ${cliente.direccion}` : ''}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-[#64748b]">
            <p>
              Corte mensual: <strong className="text-[#121d26]">Día {cliente.diaCorte}</strong> ·
              Pago: <strong className="text-[#121d26]">Día {cliente.diaPago}</strong>
            </p>
            <p className="mt-0.5">
              Tasa pactada:{' '}
              <strong className="text-[#00694d]">
                {cliente.tipoTasa} {formatPercentFromDecimal(cliente.tasa)}
              </strong>{' '}
              · TEA Mora: <strong>{formatPercentFromDecimal(cliente.teaMora)}</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* 3 Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Capital Vigente (Kv)
          </p>
          <p className="mt-1 text-2xl font-bold text-[#121d26] tabular-nums">
            {formatMoney(cliente.capitalVigente, cliente.moneda)}
          </p>
          <p className="mt-1 text-xs text-[#64748b] tabular-nums">
            Línea aprobada (L): {formatMoney(cliente.limiteCredito, cliente.moneda)} · Disponible:{' '}
            <strong className="text-[#00694d]">{formatMoney(lineaDisponible, cliente.moneda)}</strong>
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Créditos Emitidos
          </p>
          <p className="mt-1 text-2xl font-bold text-[#121d26] tabular-nums">
            {clientCreditos.length}
          </p>
          <p className="mt-1 text-xs text-[#64748b]">
            {clientCreditos.filter((c) => c.estado === 'Activo').length} activos · Plazo máx.{' '}
            {cliente.maxMeses} meses
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Total Exigible al Corte ({formatDatePE(fCorte)})
          </p>
          <p className="mt-1 text-2xl font-bold text-[#00694d] tabular-nums">
            {formatMoney(estadoCuenta?.resumenLiquidacion.totalExigibleHoy ?? 0, cliente.moneda)}
          </p>
          <p className="mt-1 text-xs text-[#805200] tabular-nums">
            Incluye mora separada:{' '}
            {formatMoney(estadoCuenta?.resumenLiquidacion.totalInteresMoratorio ?? 0, cliente.moneda)}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="no-print flex flex-wrap gap-2 border-b border-[#e6ebf0] pb-3">
        {(
          [
            { key: 'estadoCuenta', label: 'Estado de Cuenta al Corte', icon: <FileText className="size-4" /> },
            { key: 'creditos', label: `Créditos (${clientCreditos.length})`, icon: <CreditCard className="size-4" /> },
            { key: 'pagos', label: `Pagos y Abonos (${pagos.length})`, icon: <Receipt className="size-4" /> },
            { key: 'datos', label: 'Datos Contractuales', icon: <User className="size-4" /> },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              tab === item.key
                ? 'bg-[#0b3c5d] text-white shadow-xs'
                : 'bg-white text-[#475569] border border-[#e6ebf0] hover:bg-[#f4f7fa]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ESTADO DE CUENTA AL CORTE (PRINTABLE) */}
      {tab === 'estadoCuenta' && (
        <Card className="print-area p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e6ebf0] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0b3c5d]">
                Estado de Cuenta Consolidado al Corte
              </h2>
              <p className="text-xs text-[#64748b]">
                Calculado íntegramente por el motor financiero backend (Algoritmo A6)
              </p>
            </div>

            <div className="no-print w-full sm:w-64">
              <FormField
                label="Fecha de corte / consulta"
                htmlFor="fCorte"
                helpKey="estadoCuenta.fCorte"
              >
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
                  <input
                    id="fCorte"
                    type="date"
                    value={fCorte}
                    onChange={(e) => setFCorte(e.target.value)}
                    className={`${inputBaseClass} pl-9`}
                  />
                </div>
              </FormField>
            </div>
          </div>

          {loadingEC || !estadoCuenta ? (
            <PageLoader label="Generando estado de cuenta..." />
          ) : (
            <>
              {/* Ciclo & Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#e6ebf0] bg-[#f8fafc] p-4 space-y-2 text-xs">
                  <p className="font-bold uppercase tracking-wider text-[#0b3c5d]">
                    Ciclo de Facturación Vigente
                  </p>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Fecha de corte:</span>
                    <strong className="tabular-nums">{formatDatePE(estadoCuenta.ciclo.fechaCorte)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Fecha de pago oportuno:</span>
                    <strong className="tabular-nums">
                      {formatDatePE(estadoCuenta.ciclo.fechaPagoOportuno)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Días de gracia del ciclo:</span>
                    <strong className="tabular-nums">{estadoCuenta.ciclo.diasGraciaCiclo} días</strong>
                  </div>
                </div>

                <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5]/60 p-4 space-y-1.5 text-xs">
                  <p className="font-bold uppercase tracking-wider text-[#00694d]">
                    Resumen de Liquidación al {formatDatePE(fCorte)}
                  </p>
                  <div className="flex justify-between">
                    <span className="text-[#3d4a43]">Capital del ciclo actual:</span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(estadoCuenta.resumenLiquidacion.totalCapitalCiclo, cliente.moneda)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3d4a43]">Interés compensatorio del ciclo:</span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(estadoCuenta.resumenLiquidacion.totalInteresCiclo, cliente.moneda)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3d4a43]">Deuda vencida anterior:</span>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(
                        estadoCuenta.resumenLiquidacion.totalDeudaVencidaAnterior,
                        cliente.moneda
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#805200]">
                    <span className="font-semibold">Ítem separado — Interés moratorio (IM):</span>
                    <span className="font-bold tabular-nums">
                      +{formatMoney(estadoCuenta.resumenLiquidacion.totalInteresMoratorio, cliente.moneda)}
                    </span>
                  </div>
                  <div className="border-t border-[#a7f3d0] pt-1.5 flex justify-between text-sm font-bold text-[#00694d]">
                    <span>TOTAL EXIGIBLE HOY:</span>
                    <span className="tabular-nums">
                      {formatMoney(estadoCuenta.resumenLiquidacion.totalExigibleHoy, cliente.moneda)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vencidas Anteriores */}
              {estadoCuenta.cuotasVencidasAnteriores.length > 0 && (
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-[#ba1a1a]">
                    <AlertTriangle className="size-4" />
                    Cuotas Vencidas de Cortes Anteriores (con Mora)
                  </h3>
                  <EstadoCuentaTable
                    rows={estadoCuenta.cuotasVencidasAnteriores}
                    moneda={cliente.moneda}
                    onSelectCredito={(credId) => navigate(`/creditos/${credId}`)}
                  />
                </div>
              )}

              {/* Ciclo Actual */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-[#0b3c5d]">
                  Cuotas Facturadas del Ciclo Actual ({estadoCuenta.cuotasCicloActual.length})
                </h3>
                {estadoCuenta.cuotasCicloActual.length === 0 ? (
                  <p className="rounded-xl bg-[#f8fafc] p-4 text-xs text-[#64748b]">
                    No hay cuotas exigibles dentro del ciclo actual al {formatDatePE(fCorte)}.
                  </p>
                ) : (
                  <EstadoCuentaTable
                    rows={estadoCuenta.cuotasCicloActual}
                    moneda={cliente.moneda}
                    onSelectCredito={(credId) => navigate(`/creditos/${credId}`)}
                  />
                )}
              </div>

              {/* Cuotas Futuras */}
              {estadoCuenta.cuotasFuturas.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-[#64748b]">
                    Cuotas Por Vencer ({estadoCuenta.cuotasFuturas.length})
                  </h3>
                  <EstadoCuentaTable
                    rows={estadoCuenta.cuotasFuturas}
                    moneda={cliente.moneda}
                    onSelectCredito={(credId) => navigate(`/creditos/${credId}`)}
                  />
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* TAB 2: CREDITOS */}
      {tab === 'creditos' && (
        <Card className="overflow-hidden">
          <div className="table-region" role="region" tabIndex={0} aria-label="Créditos del cliente">
            <table>
              <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                <tr>
                  <th className="px-5 py-3">Fecha Emisión</th>
                  <th className="px-4 py-3">Modalidad</th>
                  <th className="px-4 py-3 text-right">Monto PL</th>
                  <th className="px-4 py-3 text-right">Cuota Ref.</th>
                  <th className="px-4 py-3 text-right">TCEA</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf0] text-sm">
                {clientCreditos.map((cr) => (
                  <tr key={cr.id} className="hover:bg-[#f4f7fa]">
                    <td className="px-5 py-3.5 tabular-nums">{formatDatePE(cr.fechaEmision)}</td>
                    <td className="px-4 py-3.5 text-xs">
                      {cr.modalidad === 'PagoUnico' ? 'Pago Único' : `${cr.plazoMeses} cuotas`}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                      {formatMoney(cr.precioLista, cr.moneda)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {formatMoney(cr.cuota, cr.moneda)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-semibold text-[#00694d] tabular-nums">
                      {(cr.tcea * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={cr.estado === 'Cancelado' ? 'emerald' : 'navy'}>
                        {cr.estado}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/creditos/${cr.id}`)}
                      >
                        Ver cronograma
                      </Button>
                    </td>
                  </tr>
                ))}
                {clientCreditos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#64748b]">
                      El cliente aún no registra créditos emitidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: PAGOS */}
      {tab === 'pagos' && (
        <Card className="overflow-hidden">
          <div className="table-region" role="region" tabIndex={0} aria-label="Pagos realizados">
            <table>
              <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                <tr>
                  <th className="px-5 py-3">Fecha Pago</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3 text-right">Días Mora</th>
                  <th className="px-4 py-3 text-right">1° Mora</th>
                  <th className="px-4 py-3 text-right">2° Compensatorio</th>
                  <th className="px-4 py-3 text-right">3° Capital</th>
                  <th className="px-5 py-3 text-right">Total Pagado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf0] text-sm">
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3.5 tabular-nums">{formatDatePE(p.fechaPago)}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="slate">{p.metodoPago || 'EFECTIVO'}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">{p.diasMora}</td>
                    <td className="px-4 py-3.5 text-right text-[#805200] tabular-nums">
                      {formatMoney(p.interesMoratorio, cliente.moneda)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums">
                      {formatMoney(p.interesCompensatorio, cliente.moneda)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[#00694d] font-semibold tabular-nums">
                      {formatMoney(p.amortizacionCapital, cliente.moneda)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold tabular-nums">
                      {formatMoney(p.montoPagado, cliente.moneda)}
                    </td>
                  </tr>
                ))}
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-sm text-[#64748b]">
                      Aún no se han registrado pagos para este cliente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: DATOS CONTRACTUALES */}
      {tab === 'datos' && (
        <Card className="p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
            <div>
              <dt className="text-xs text-[#64748b]">Ingresos Netos Mensuales</dt>
              <dd className="mt-1 font-bold tabular-nums">
                {formatMoney(cliente.ingresosNetos, cliente.moneda)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#64748b]">Tipo y Valor de Tasa</dt>
              <dd className="mt-1 font-bold tabular-nums">
                {cliente.tipoTasa} {formatPercentFromDecimal(cliente.tasa)} (m={cliente.capitalizacion})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#64748b]">TEA Moratoria</dt>
              <dd className="mt-1 font-bold tabular-nums">
                {formatPercentFromDecimal(cliente.teaMora)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#64748b]">Correo Portal Vecino</dt>
              <dd className="mt-1 font-semibold">{cliente.email || 'No configurado'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#64748b]">Teléfono</dt>
              <dd className="mt-1 font-semibold">{cliente.telefono || 'No registrado'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#64748b]">Dirección</dt>
              <dd className="mt-1 font-semibold">{cliente.direccion || 'No registrada'}</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}

function EstadoCuentaTable({
  rows,
  moneda,
  onSelectCredito,
}: {
  rows: Array<{
    cuotaId: string;
    creditoId: string;
    numeroCuota: number;
    fechaVencimiento: string;
    amortizacion: number;
    interesCompensatorio: number;
    cuotaBase: number;
    diasMora: number;
    interesMoratorio: number;
    totalExigible: number;
    estado: string;
  }>;
  moneda: string;
  onSelectCredito: (creditoId: string) => void;
}) {
  return (
    <div className="table-region rounded-xl border border-[#e6ebf0]" role="region" tabIndex={0}>
      <table>
        <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
          <tr>
            <th className="px-4 py-2.5">Cuota</th>
            <th className="px-4 py-2.5">Vencimiento</th>
            <th className="px-4 py-2.5 text-right">Capital</th>
            <th className="px-4 py-2.5 text-right">Int. Comp.</th>
            <th className="px-4 py-2.5 text-right">Mora (dm)</th>
            <th className="px-4 py-2.5 text-right">Total Exigible</th>
            <th className="no-print px-4 py-2.5 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e6ebf0] text-xs sm:text-sm">
          {rows.map((r) => (
            <tr key={r.cuotaId} className="hover:bg-[#f4f7fa]">
              <td className="px-4 py-3 font-semibold">
                Cuota #{r.numeroCuota}
                <span className="ml-2">
                  <Badge
                    variant={
                      r.estado === 'Vencida'
                        ? 'red'
                        : r.estado === 'Exigible'
                        ? 'amber'
                        : 'slate'
                    }
                  >
                    {r.estado}
                  </Badge>
                </span>
              </td>
              <td className="px-4 py-3 tabular-nums">{formatDatePE(r.fechaVencimiento)}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatMoney(r.amortizacion, moneda)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatMoney(r.interesCompensatorio, moneda)}
              </td>
              <td className="px-4 py-3 text-right text-[#805200] font-semibold tabular-nums">
                {r.diasMora > 0
                  ? `+${formatMoney(r.interesMoratorio, moneda)} (${r.diasMora}d)`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-right font-bold text-[#121d26] tabular-nums">
                {formatMoney(r.totalExigible, moneda)}
              </td>
              <td className="no-print px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSelectCredito(r.creditoId)}
                  className="text-xs font-semibold text-[#00694d] hover:underline cursor-pointer"
                >
                  Ir a pagar →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
