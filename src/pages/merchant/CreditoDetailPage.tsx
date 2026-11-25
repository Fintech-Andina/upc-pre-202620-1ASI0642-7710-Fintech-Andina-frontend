import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Banknote, CreditCard, Printer, ShieldCheck } from 'lucide-react';
import { clientesApi, creditosApi } from '@/api/endpoints';
import type { Cuota } from '@/types/api';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/EmptyState';
import { RegistrarPagoModal } from '@/components/modals/RegistrarPagoModal';
import { formatDatePE, formatMoney } from '@/utils/formatters';

export function CreditoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['credito', id],
    queryFn: () => creditosApi.obtenerPorId(id!),
    enabled: Boolean(id),
  });

  const credito = data?.credito;
  const cuotas = data?.cuotas ?? [];

  const { data: cliente } = useQuery({
    queryKey: ['cliente', credito?.clienteId],
    queryFn: () => clientesApi.obtenerPorId(credito!.clienteId),
    enabled: Boolean(credito?.clienteId),
  });

  if (isLoading || !credito) {
    return <PageLoader label="Cargando detalle y cronograma del crédito..." />;
  }

  const nextUnpaid = cuotas.find((c) => c.estado !== 'Pagada') ?? null;
  const paidCount = cuotas.filter((c) => c.estado === 'Pagada').length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/creditos')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0b3c5d] hover:text-[#00694d] cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Volver a créditos
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir cronograma
          </Button>
          {nextUnpaid && (
            <Button size="sm" onClick={() => setSelectedCuota(nextUnpaid)}>
              <Banknote className="size-4" />
              Registrar pago (Cuota {nextUnpaid.numero})
            </Button>
          )}
        </div>
      </div>

      {/* Title Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#ecfdf5] text-[#00694d]">
              <CreditCard className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#121d26]">
                  Crédito {credito.id.slice(0, 8).toUpperCase()}
                </h1>
                <Badge
                  variant={
                    credito.estado === 'Cancelado'
                      ? 'emerald'
                      : credito.estado === 'Vencido'
                      ? 'red'
                      : 'navy'
                  }
                >
                  {credito.estado}
                </Badge>
                <Badge variant="slate">{credito.modalidad}</Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#64748b]">
                Cliente:{' '}
                <strong className="text-[#121d26]">
                  {cliente?.nombreCompleto ?? credito.clienteId}
                </strong>
                {cliente ? ` · ${cliente.tipoDoc} ${cliente.numDoc}` : ''} · Emitido el{' '}
                {formatDatePE(credito.fechaEmision)}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-[#64748b]">
            <p>
              Corte: <strong className="text-[#121d26]">{formatDatePE(credito.fechaCorte)}</strong> ·
              1er Pago:{' '}
              <strong className="text-[#121d26]">{formatDatePE(credito.primeraFechaPago)}</strong>
            </p>
            <p className="mt-0.5">
              TCEA: <strong className="text-[#00694d]">{(credito.tcea * 100).toFixed(4)}%</strong> ·
              TREA: <strong className="text-[#0b3c5d]">{(credito.trea * 100).toFixed(4)}%</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-[#64748b]">Monto Nominal (PL)</p>
          <p className="mt-1 text-2xl font-bold text-[#121d26] tabular-nums">
            {formatMoney(credito.precioLista, credito.moneda)}
          </p>
          <p className="mt-0.5 text-xs text-[#00694d]">
            TEA: {(credito.tea * 100).toFixed(2)}% · TEM: {(credito.tem * 100).toFixed(4)}%
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-[#64748b]">Capital Capitalizado (P&apos;)</p>
          <p className="mt-1 text-2xl font-bold text-[#121d26] tabular-nums">
            {formatMoney(credito.capitalCapitalizado, credito.moneda)}
          </p>
          <p className="mt-0.5 text-xs text-[#64748b]">Gracia total: {credito.diasGracia} días</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-[#64748b]">Cuota Referencial</p>
          <p className="mt-1 text-2xl font-bold text-[#00694d] tabular-nums">
            {formatMoney(credito.cuota, credito.moneda)}
          </p>
          <p className="mt-0.5 text-xs text-[#64748b]">
            {paidCount} de {cuotas.length} cuotas pagadas
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-[#64748b]">TEA Moratoria Pactada</p>
          <p className="mt-1 text-2xl font-bold text-[#805200] tabular-nums">
            {(credito.teaMora * 100).toFixed(2)}%
          </p>
          <p className="mt-0.5 text-xs text-[#64748b]">Sin anatocismo (base 360)</p>
        </Card>
      </div>

      {/* Schedule Table */}
      <Card className="print-area overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6ebf0] px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#0b3c5d]">Cronograma de Pagos</h2>
            <p className="text-xs text-[#64748b]">
              Basado en buenas prácticas financieras y estándares de transparencia (referencia
              metodológica BCRP / SBS y Ley N.° 31143).
            </p>
          </div>
          <Badge variant="navy">{credito.moneda}</Badge>
        </div>

        <div className="table-region" role="region" tabIndex={0} aria-label="Cronograma del crédito">
          <table>
            <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              <tr>
                <th className="px-4 py-3">Cuota</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3 text-right">Saldo Inicial</th>
                <th className="px-4 py-3 text-right">Interés</th>
                <th className="px-4 py-3 text-right">Amortización</th>
                <th className="px-4 py-3 text-right">Cuota</th>
                <th className="px-4 py-3 text-right">Saldo Final</th>
                <th className="px-4 py-3">Estado</th>
                <th className="no-print px-4 py-3 text-right">Cobranza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf0] text-xs sm:text-sm">
              {cuotas.map((c) => (
                <tr key={c.id} className="hover:bg-[#f4f7fa]">
                  <td className="px-4 py-3.5 font-semibold">
                    #{c.numero}{' '}
                    <span className="text-[11px] font-normal text-[#64748b]">({c.tK}d)</span>
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">{formatDatePE(c.fechaVencimiento)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {formatMoney(c.saldoInicial, credito.moneda)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {formatMoney(c.interes, credito.moneda)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[#00694d] font-medium tabular-nums">
                    {formatMoney(c.amortizacion, credito.moneda)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                    {formatMoney(c.cuota, credito.moneda)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    {formatMoney(c.saldoFinal, credito.moneda)}
                  </td>
                  <td className="px-4 py-3.5">
                    {c.estado === 'Pagada' ? (
                      <div>
                        <Badge variant="emerald">Pagada</Badge>
                        {c.fechaPago && (
                          <p className="mt-0.5 text-[10.5px] text-[#64748b]">
                            {formatDatePE(c.fechaPago)}
                            {c.diasMora > 0 ? ` (${c.diasMora}d mora)` : ''}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant={c.estado === 'Vencida' ? 'red' : 'amber'}>
                        {c.estado}
                      </Badge>
                    )}
                  </td>
                  <td className="no-print px-4 py-3.5 text-right">
                    {c.estado === 'Pagada' ? (
                      <span className="text-xs font-semibold text-[#00694d] tabular-nums">
                        {formatMoney(c.totalPagado, credito.moneda)}
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => setSelectedCuota(c)}>
                        <Banknote className="size-3.5" />
                        Pagar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[#e6ebf0] bg-[#f8fafc] px-6 py-3 flex items-center gap-2 text-xs text-[#64748b]">
          <ShieldCheck className="size-4 text-[#00694d]" />
          <span>
            No se admiten pagos parciales. Todo abono sigue la prelación legal: 1° Interés Moratorio
            → 2° Interés Compensatorio → 3° Amortización de Capital.
          </span>
        </div>
      </Card>

      <RegistrarPagoModal
        open={Boolean(selectedCuota)}
        onClose={() => setSelectedCuota(null)}
        credito={credito}
        cuota={selectedCuota}
        cliente={cliente}
      />
    </div>
  );
}
