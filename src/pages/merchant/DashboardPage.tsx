import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Coins,
  CreditCard,
  Percent,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { clientesApi, creditosApi, reportesApi } from '@/api/endpoints';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/EmptyState';
import { formatDatePE, formatMoney, getInitials } from '@/utils/formatters';

export function DashboardPage() {
  const { tienda } = useAuth();
  const { currencyFilter, displayCurrency } = useCurrency();
  const navigate = useNavigate();

  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportesApi.dashboard,
  });

  const { data: creditos = [], isLoading: loadingCred } = useQuery({
    queryKey: ['creditos'],
    queryFn: creditosApi.listar,
  });

  const { data: clientes = [], isLoading: loadingCli } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.listar,
  });

  if (loadingDash || loadingCred || loadingCli) {
    return <PageLoader label="Cargando tablero gerencial de Defia Book..." />;
  }

  const clientesMap = new Map(clientes.map((c) => [c.id, c]));
  const filteredCreditos =
    currencyFilter === 'ALL' ? creditos : creditos.filter((c) => c.moneda === currencyFilter);

  const resumen = dashboard?.resumenCartera;
  const recaudacion = dashboard?.recaudacion;
  const volumen = dashboard?.volumenOperativo;

  // Chart data derived purely from backend credit records (no math formulas)
  const chartData = filteredCreditos.slice(0, 6).map((c, idx) => {
    const cli = clientesMap.get(c.clienteId);
    const label = cli ? cli.nombreCompleto.split(' ')[0] : `Créd. ${idx + 1}`;
    return {
      nombre: `${label} (${c.moneda})`,
      Colocado: c.precioLista,
      Capitalizado: c.capitalCapitalizado,
      Cuota: c.cuota,
    };
  });

  const clientesConDeuda = clientes
    .filter((c) => c.capitalVigente > 0 && (currencyFilter === 'ALL' || c.moneda === currencyFilter))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* HERO BANNER */}
      <section
        className="relative overflow-hidden rounded-[20px] border border-white/10 p-6 sm:p-8 text-white shadow-[0_4px_20px_rgba(15,60,93,0.08)]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, #0b3c5d 0%, #0a4d6b 50%, #0f9d75 100%)',
        }}
      >
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-[#34d399]/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/70">
              PANEL DE CONTROL GERENCIAL
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ¡Bienvenido, {tienda?.nombreComercial || tienda?.nombre || 'Comerciante'}!
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-[#a7f3d0]">
              <span className="size-1.5 rounded-full bg-[#6ee7b7]" />
              <span>
                {tienda?.razonSocial || 'Bodega Afiliada'} · RUC {tienda?.ruc || '—'} ·{' '}
                {volumen?.totalCreditosActivos ?? 0} créditos activos
              </span>
            </div>
            <p className="text-sm text-white/85 leading-relaxed">
              Tu cuaderno digital de fiados y créditos al alcance de la mano. Métricas reales
              calculadas en servidor en base comercial de 360 días.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={() => navigate('/creditos/nuevo')}
                className="bg-white text-[#0a7a5b] hover:bg-[#ecfdf5] shadow-md"
              >
                <Plus className="size-4" />
                Nuevo crédito
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/clientes')}
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                <Users className="size-4" />
                Ver lista de clientes
              </Button>
            </div>
          </div>

          {/* Right Frosted Cards */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-52 rounded-2xl border border-white/20 bg-white/12 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/80">
                <span>RECAUDACIÓN REAL</span>
                <Wallet className="size-4 text-[#82f8ca]" />
              </div>
              <div className="my-2">
                <p className="text-[11px] text-white/70">Total cobrado acumulado</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {formatMoney(recaudacion?.totalRecaudado, displayCurrency)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#a7f3d0]">
                <span className="size-1.5 rounded-full bg-[#34d399]" />
                <span>
                  {volumen?.totalCuotasPagadas ?? 0} de {volumen?.totalCuotasEmitidas ?? 0} cuotas pagadas
                </span>
              </div>
            </div>

            <div className="w-full sm:w-56 rounded-2xl border border-white/20 bg-[#082b44]/80 p-4 backdrop-blur-md shadow-lg flex flex-col justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#65dbaf]">
                Desglose de Recaudación
              </p>
              <dl className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-white/70">Capital recuperado</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatMoney(recaudacion?.totalCapitalRecuperado, displayCurrency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/70">Int. Compensatorio</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatMoney(recaudacion?.totalInteresCompensatorioRecaudado, displayCurrency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/70">Int. Moratorio</dt>
                  <dd className="font-semibold text-[#fcd34d] tabular-nums">
                    {formatMoney(recaudacion?.totalInteresMoratorioRecaudado, displayCurrency)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* 4 KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <Card className="p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#00694d]">
                <Coins className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  Capital Colocado
                </p>
                <p className="text-[11px] text-[#94a3b8]">Total emitido (PL)</p>
              </div>
            </div>
            <Badge variant="emerald">{volumen?.totalCreditosEmitidos ?? 0} créd.</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#0f172a] tabular-nums">
              {formatMoney(resumen?.totalCapitalColocado, displayCurrency)}
            </p>
            <p className="mt-1 text-xs font-medium text-[#0f9d75]">
              {volumen?.totalClientes ?? 0} clientes registrados
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#fffbeb] text-[#b45309]">
                <CalendarClock className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  Cartera Vigente
                </p>
                <p className="text-[11px] text-[#94a3b8]">Capital vivo (Kv)</p>
              </div>
            </div>
            <Badge variant="amber">Activa</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#0f172a] tabular-nums">
              {formatMoney(resumen?.carteraVigenteActiva, displayCurrency)}
            </p>
            <p className="mt-1 text-xs font-medium text-[#d97706]">
              {(volumen?.totalCuotasEmitidas ?? 0) - (volumen?.totalCuotasPagadas ?? 0)} cuotas por cobrar
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#fef2f2] text-[#ba1a1a]">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  Cartera en Mora
                </p>
                <p className="text-[11px] text-[#94a3b8]">Cuotas vencidas</p>
              </div>
            </div>
            <Badge variant={(resumen?.carteraVencidaEnMora ?? 0) > 0 ? 'red' : 'emerald'}>
              {(resumen?.ratioMorosidadPct ?? 0).toFixed(2)}%
            </Badge>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#0f172a] tabular-nums">
              {formatMoney(resumen?.carteraVencidaEnMora, displayCurrency)}
            </p>
            <p
              className={`mt-1 text-xs font-medium ${
                (resumen?.carteraVencidaEnMora ?? 0) > 0 ? 'text-[#dc2626]' : 'text-[#00694d]'
              }`}
            >
              {(resumen?.carteraVencidaEnMora ?? 0) > 0
                ? 'Requiere gestión de cobranza'
                : 'Cartera saludable sin morosidad'}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#f0f6fa] text-[#0b3c5d]">
                <Percent className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  TREA Ponderada
                </p>
                <p className="text-[11px] text-[#94a3b8]">Rendimiento anual</p>
              </div>
            </div>
            <Badge variant="navy">Base 360</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#0f172a] tabular-nums">
              {(resumen?.treaPromedioPonderadaPct ?? 0).toFixed(2)}%
            </p>
            <p className="mt-1 text-xs font-medium text-[#64748b]">
              Ponderada por capital colocado
            </p>
          </div>
        </Card>
      </section>

      {/* MAIN 2-COLUMN SECTION */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT 2/3: Chart + Recent Credits Table */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#e6ebf0] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">
                  Colocación y Capitalización por Crédito
                </h2>
                <p className="text-xs text-[#64748b]">
                  Comparativa entre Precio Lista (PL) y Capital Capitalizado (P&apos;) devueltos por el servidor
                </p>
              </div>
              <Link
                to="/reportes"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00694d] hover:underline"
              >
                Ver analítica completa
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {chartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-[#64748b]">
                Aún no hay créditos emitidos para graficar en la moneda seleccionada.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        borderColor: '#e6ebf0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Colocado" fill="#0f9d75" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Capitalizado" fill="#0b3c5d" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e6ebf0] px-6 py-4">
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">Créditos Recientes</h2>
                <p className="text-xs text-[#64748b]">
                  Haz clic en un crédito para ver su cronograma completo o registrar pagos
                </p>
              </div>
              <Link
                to="/creditos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00694d] hover:underline"
              >
                Ver todos ({filteredCreditos.length})
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="table-region" role="region" tabIndex={0} aria-label="Créditos recientes">
              <table>
                <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  <tr>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-4 py-3">Modalidad</th>
                    <th className="px-4 py-3">Próx. / 1er Pago</th>
                    <th className="px-4 py-3 text-right">Cuota Ref.</th>
                    <th className="px-4 py-3 text-right">TCEA</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6ebf0] text-sm">
                  {filteredCreditos.slice(0, 5).map((cr) => {
                    const cli = clientesMap.get(cr.clienteId);
                    return (
                      <tr
                        key={cr.id}
                        onClick={() => navigate(`/creditos/${cr.id}`)}
                        className="cursor-pointer transition-colors hover:bg-[#f4f7fa]"
                      >
                        <td className="px-5 py-3.5 font-semibold text-[#121d26]">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-xs font-bold text-[#0b3c5d]">
                              {getInitials(cli?.nombreCompleto)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold">{cli?.nombreCompleto || 'Cliente'}</p>
                              <p className="text-[11px] text-[#64748b]">
                                PL: {formatMoney(cr.precioLista, cr.moneda)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#3d4a43]">
                          {cr.modalidad === 'PagoUnico' ? 'Pago Único' : `${cr.plazoMeses} cuotas`}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#3d4a43] tabular-nums">
                          {formatDatePE(cr.primeraFechaPago)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-[#121d26] tabular-nums">
                          {formatMoney(cr.cuota, cr.moneda)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs font-semibold text-[#00694d] tabular-nums">
                          {(cr.tcea * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3.5">
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
                      </tr>
                    );
                  })}
                  {filteredCreditos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#64748b]">
                        No hay créditos registrados en esta vista.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT 1/3: Debtors & Regulatory Quick Info */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#0f9d75]" />
                <h2 className="text-base font-bold text-[#0f172a]">Clientes con Capital Vivo</h2>
              </div>
              <Link to="/clientes" className="text-xs font-semibold text-[#00694d] hover:underline">
                Ver todos
              </Link>
            </div>

            <div className="space-y-3">
              {clientesConDeuda.map((cli) => (
                <div
                  key={cli.id}
                  onClick={() => navigate(`/clientes/${cli.id}`)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#e6ebf0] p-3 transition-colors hover:bg-[#f4f7fa] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-xs font-bold text-[#0b3c5d]">
                      {getInitials(cli.nombreCompleto)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#121d26]">
                        {cli.nombreCompleto}
                      </p>
                      <p className="text-[11px] text-[#64748b]">
                        Corte día {cli.diaCorte} · Pago día {cli.diaPago}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#0b3c5d] tabular-nums">
                      {formatMoney(cli.capitalVigente, cli.moneda)}
                    </p>
                    <p className="text-[11px] text-[#64748b] tabular-nums">
                      de {formatMoney(cli.limiteCredito, cli.moneda)}
                    </p>
                  </div>
                </div>
              ))}
              {clientesConDeuda.length === 0 && (
                <p className="py-6 text-center text-xs text-[#64748b]">
                  Sin clientes con saldo pendiente actualmente.
                </p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="navy" size="sm" onClick={() => navigate('/creditos')}>
                <CreditCard className="size-3.5" />
                Ir a Cobranzas
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/reglas')}>
                <TrendingUp className="size-3.5" />
                Simulador
              </Button>
            </div>
          </Card>

          <Card className="p-5 bg-[#f8fafc]">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#00694d]">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#0b3c5d]">Transparencia y Buenas Prácticas</h3>
                <p className="text-xs leading-relaxed text-[#3d4a43]">
                  Basado en buenas prácticas financieras y estándares de transparencia (referencia
                  metodológica BCRP / SBS y Ley N.° 31143).
                </p>
                <p className="text-[11px] font-medium text-[#00694d]">
                  Prelación legal automática: 1° Mora → 2° Compensatorio → 3° Capital.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
