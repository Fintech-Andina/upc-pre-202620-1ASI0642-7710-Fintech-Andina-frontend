import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Eye, Plus, Search } from 'lucide-react';
import { clientesApi, creditosApi } from '@/api/endpoints';
import { useCurrency } from '@/context/CurrencyContext';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageLoader } from '@/components/ui/EmptyState';
import { formatDatePE, formatMoney } from '@/utils/formatters';

export function CreditosPage() {
  const navigate = useNavigate();
  const { currencyFilter } = useCurrency();
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'ALL' | 'Activo' | 'Cancelado' | 'Vencido'>('ALL');

  const { data: creditos = [], isLoading: loadingCred } = useQuery({
    queryKey: ['creditos'],
    queryFn: creditosApi.listar,
  });

  const { data: clientes = [], isLoading: loadingCli } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.listar,
  });

  if (loadingCred || loadingCli) {
    return <PageLoader label="Cargando cartera de créditos..." />;
  }

  const clientesMap = new Map(clientes.map((c) => [c.id, c]));
  const q = search.trim().toLowerCase();

  const filtered = creditos.filter((cr) => {
    if (currencyFilter !== 'ALL' && cr.moneda !== currencyFilter) return false;
    if (estadoFilter !== 'ALL' && cr.estado !== estadoFilter) return false;
    if (!q) return true;
    const cli = clientesMap.get(cr.clienteId);
    return (
      cr.id.toLowerCase().includes(q) ||
      (cli?.nombreCompleto ?? '').toLowerCase().includes(q) ||
      (cli?.numDoc ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
            Cartera y Cobranzas
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">Lista de Créditos</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Consulta todos los créditos emitidos, su TCEA/TREA real y accede al registro de pagos.
          </p>
        </div>

        <Button onClick={() => navigate('/creditos/nuevo')}>
          <Plus className="size-4" />
          Nuevo crédito
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, DNI o ID de crédito..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm focus:border-[#0f9d75] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'Activo', 'Cancelado', 'Vencido'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setEstadoFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  estadoFilter === st
                    ? 'bg-[#0b3c5d] text-white'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {st === 'ALL' ? `Todos (${creditos.length})` : st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="size-6" />}
          title="No hay créditos que coincidan"
          description="Emite un nuevo crédito con el asistente guiado o ajusta los filtros actuales."
          action={
            <Button onClick={() => navigate('/creditos/nuevo')}>
              <Plus className="size-4" />
              Emitir crédito
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="table-region" role="region" tabIndex={0} aria-label="Listado de créditos">
            <table>
              <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Emisión / 1er Pago</th>
                  <th className="px-4 py-3.5">Modalidad</th>
                  <th className="px-4 py-3.5 text-right">PL / Capitalizado</th>
                  <th className="px-4 py-3.5 text-right">Cuota Ref.</th>
                  <th className="px-4 py-3.5 text-right">TCEA</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf0] text-sm">
                {filtered.map((cr) => {
                  const cli = clientesMap.get(cr.clienteId);
                  return (
                    <tr key={cr.id} className="hover:bg-[#f4f7fa]">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#121d26]">
                          {cli?.nombreCompleto || 'Cliente'}
                        </p>
                        <p className="text-xs text-[#64748b]">
                          {cli ? `${cli.tipoDoc} ${cli.numDoc}` : cr.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#3d4a43] tabular-nums">
                        <p>Emisión: {formatDatePE(cr.fechaEmision)}</p>
                        <p className="text-[#64748b]">1er pago: {formatDatePE(cr.primeraFechaPago)}</p>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <Badge variant="navy">{cr.moneda}</Badge>
                        <p className="mt-1 text-[#3d4a43]">
                          {cr.modalidad === 'PagoUnico' ? 'Pago Único' : `${cr.plazoMeses} cuotas`}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums">
                        <p className="font-bold text-[#121d26]">
                          {formatMoney(cr.precioLista, cr.moneda)}
                        </p>
                        <p className="text-[11px] text-[#64748b]">
                          P&apos;: {formatMoney(cr.capitalCapitalizado, cr.moneda)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-[#00694d] tabular-nums">
                        {formatMoney(cr.cuota, cr.moneda)}
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-semibold text-[#0b3c5d] tabular-nums">
                        {(cr.tcea * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            cr.estado === 'Cancelado'
                              ? 'emerald'
                              : cr.estado === 'Vencido'
                              ? 'red'
                              : 'navy'
                          }
                        >
                          {cr.estado}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/creditos/${cr.id}`)}
                        >
                          <Eye className="size-3.5" />
                          Ver y Cobrar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
