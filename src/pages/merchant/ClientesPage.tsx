import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, Plus, Power, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { clientesApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import { useCurrency } from '@/context/CurrencyContext';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageLoader } from '@/components/ui/EmptyState';
import { formatMoney, formatPercentFromDecimal, getInitials } from '@/utils/formatters';

export function ClientesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currencyFilter } = useCurrency();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVO' | 'INACTIVO'>('ALL');

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.listar,
  });

  const toggleEstadoMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      clientesApi.cambiarEstado(id, activo),
    onSuccess: (updated) => {
      toast.success(
        `Cliente ${updated.nombreCompleto} ${updated.activo ? 'activado' : 'desactivado'}`
      );
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });

  if (isLoading) {
    return <PageLoader label="Cargando cartera de clientes..." />;
  }

  const q = search.trim().toLowerCase();
  const filtered = clientes.filter((c) => {
    if (currencyFilter !== 'ALL' && c.moneda !== currencyFilter) return false;
    if (statusFilter === 'ACTIVO' && !c.activo) return false;
    if (statusFilter === 'INACTIVO' && c.activo) return false;
    if (!q) return true;
    return (
      c.nombreCompleto.toLowerCase().includes(q) ||
      c.numDoc.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
            Cartera de Vecinos
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">Clientes y Líneas</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Administra límites de crédito aprobados, tasas contractuales y estados de cuenta al corte.
          </p>
        </div>

        <Button onClick={() => navigate('/clientes/nuevo')}>
          <Plus className="size-4" />
          Nuevo cliente
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, DNI/RUC o correo..."
              className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-2.5 pl-10 pr-4 text-sm text-[#121d26] focus:border-[#0f9d75] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'ACTIVO', 'INACTIVO'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#0b3c5d] text-white'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {st === 'ALL' ? `Todos (${clientes.length})` : st === 'ACTIVO' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="No se encontraron clientes"
          description="Ajusta los filtros de búsqueda o registra un nuevo vecino con su línea de crédito."
          action={
            <Button onClick={() => navigate('/clientes/nuevo')}>
              <Plus className="size-4" />
              Registrar cliente
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="table-region" role="region" tabIndex={0} aria-label="Listado de clientes">
            <table>
              <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                <tr>
                  <th className="px-5 py-3.5">Vecino / Documento</th>
                  <th className="px-4 py-3.5">Condición Tasa</th>
                  <th className="px-4 py-3.5">Corte / Pago</th>
                  <th className="px-4 py-3.5">Uso de Línea (Kv / L)</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6ebf0] text-sm">
                {filtered.map((cli) => {
                  const pctUso =
                    cli.limiteCredito > 0
                      ? Math.min(100, (cli.capitalVigente / cli.limiteCredito) * 100)
                      : 0;
                  return (
                    <tr key={cli.id} className="hover:bg-[#f4f7fa]/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-xs font-bold text-[#0b3c5d]">
                            {getInitials(cli.nombreCompleto)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#121d26]">{cli.nombreCompleto}</p>
                            <p className="text-xs text-[#64748b]">
                              {cli.tipoDoc} {cli.numDoc}
                              {cli.email ? ` · ${cli.email}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs">
                        <Badge variant="navy">{cli.moneda}</Badge>
                        <p className="mt-1 font-semibold text-[#121d26] tabular-nums">
                          {cli.tipoTasa} {formatPercentFromDecimal(cli.tasa)}
                        </p>
                        <p className="text-[11px] text-[#64748b] tabular-nums">
                          Mora TEA: {formatPercentFromDecimal(cli.teaMora)}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-xs text-[#3d4a43]">
                        <p>
                          Corte: <strong className="text-[#121d26]">Día {cli.diaCorte}</strong>
                        </p>
                        <p>
                          Pago: <strong className="text-[#121d26]">Día {cli.diaPago}</strong>
                        </p>
                        <p className="text-[11px] text-[#64748b]">Máx. {cli.maxMeses} meses</p>
                      </td>

                      <td className="px-4 py-4 min-w-[200px]">
                        <div className="flex justify-between text-xs mb-1 tabular-nums">
                          <span className="font-semibold text-[#121d26]">
                            {formatMoney(cli.capitalVigente, cli.moneda)}
                          </span>
                          <span className="text-[#64748b]">
                            de {formatMoney(cli.limiteCredito, cli.moneda)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                          <div
                            className={`h-full rounded-full ${
                              pctUso > 85 ? 'bg-[#ba1a1a]' : 'bg-[#0f9d75]'
                            }`}
                            style={{ width: `${pctUso}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge variant={cli.activo ? 'emerald' : 'slate'}>
                          {cli.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/clientes/${cli.id}`)}
                          >
                            <Eye className="size-3.5" />
                            Expediente
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/clientes/${cli.id}/editar`)}
                            title="Editar cliente"
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            loading={toggleEstadoMutation.isPending}
                            onClick={() =>
                              toggleEstadoMutation.mutate({ id: cli.id, activo: !cli.activo })
                            }
                            title={cli.activo ? 'Desactivar cliente' : 'Activar cliente'}
                          >
                            <Power className="size-3.5" />
                          </Button>
                        </div>
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
