import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Printer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { clientesApi, creditosApi, reportesApi } from '@/api/endpoints';
import { useCurrency } from '@/context/CurrencyContext';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/EmptyState';
import { formatMoney } from '@/utils/formatters';

export function ReportesPage() {
  const { displayCurrency } = useCurrency();

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

  if (loadingDash || loadingCred || loadingCli || !dashboard) {
    return <PageLoader label="Cargando indicadores gerenciales y gráficos..." />;
  }

  const clientesMap = new Map(clientes.map((c) => [c.id, c]));
  const { resumenCartera, recaudacion, volumenOperativo } = dashboard;

  const carteraDonut = [
    {
      name: 'Cartera al Día',
      value: Math.max(0, resumenCartera.carteraVigenteActiva - resumenCartera.carteraVencidaEnMora),
    },
    { name: 'Cartera en Mora', value: resumenCartera.carteraVencidaEnMora },
  ];

  const recaudacionBars = [
    {
      concepto: 'Capital',
      Monto: recaudacion.totalCapitalRecuperado,
      fill: '#0f9d75',
    },
    {
      concepto: 'Compensatorio',
      Monto: recaudacion.totalInteresCompensatorioRecaudado,
      fill: '#0b3c5d',
    },
    {
      concepto: 'Moratorio',
      Monto: recaudacion.totalInteresMoratorioRecaudado,
      fill: '#f59e0b',
    },
  ];

  const treaSeries = creditos.map((cr, idx) => {
    const cli = clientesMap.get(cr.clienteId);
    return {
      credito: cli ? `${cli.nombreCompleto.split(' ')[0]} #${idx + 1}` : `Créd. ${idx + 1}`,
      TCEA: Number((cr.tcea * 100).toFixed(2)),
      TREA: Number((cr.trea * 100).toFixed(2)),
    };
  });

  const handleExportCsv = () => {
    const lines = [
      'Indicador,Valor',
      `Total Capital Colocado,${resumenCartera.totalCapitalColocado}`,
      `Cartera Vigente Activa,${resumenCartera.carteraVigenteActiva}`,
      `Cartera Vencida en Mora,${resumenCartera.carteraVencidaEnMora}`,
      `Ratio Morosidad (%),${resumenCartera.ratioMorosidadPct}`,
      `TREA Promedio Ponderada (%),${resumenCartera.treaPromedioPonderadaPct}`,
      `Total Recaudado,${recaudacion.totalRecaudado}`,
      `Capital Recuperado,${recaudacion.totalCapitalRecuperado}`,
      `Interes Compensatorio Recaudado,${recaudacion.totalInteresCompensatorioRecaudado}`,
      `Interes Moratorio Recaudado,${recaudacion.totalInteresMoratorioRecaudado}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte-cartera-defiabook.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
            Analítica de Cartera
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">
            Reportes e Indicadores
          </h1>
          <p className="mt-0.5 text-sm text-[#64748b]">
            Métricas consolidadas en tiempo real calculadas por el servidor backend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir reporte
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs text-[#64748b]">Capital Colocado</p>
          <p className="mt-1 text-2xl font-bold text-[#121d26] tabular-nums">
            {formatMoney(resumenCartera.totalCapitalColocado, displayCurrency)}
          </p>
          <p className="mt-1 text-xs text-[#64748b]">
            {volumenOperativo.totalCreditosEmitidos} créditos emitidos
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[#64748b]">Total Recaudado</p>
          <p className="mt-1 text-2xl font-bold text-[#00694d] tabular-nums">
            {formatMoney(recaudacion.totalRecaudado, displayCurrency)}
          </p>
          <p className="mt-1 text-xs text-[#00694d]">
            {volumenOperativo.totalCuotasPagadas} de {volumenOperativo.totalCuotasEmitidas} cuotas
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[#64748b]">Ratio de Morosidad</p>
          <p className="mt-1 text-2xl font-bold text-[#ba1a1a] tabular-nums">
            {resumenCartera.ratioMorosidadPct.toFixed(2)}%
          </p>
          <p className="mt-1 text-xs text-[#64748b]">
            Mora: {formatMoney(resumenCartera.carteraVencidaEnMora, displayCurrency)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-[#64748b]">TREA Promedio Ponderada</p>
          <p className="mt-1 text-2xl font-bold text-[#0b3c5d] tabular-nums">
            {resumenCartera.treaPromedioPonderadaPct.toFixed(2)}%
          </p>
          <p className="mt-1 text-xs text-[#64748b]">Ponderada por volumen colocado</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0b3c5d]">
                Desglose de Recaudación por Prelación
              </h2>
              <p className="text-xs text-[#64748b]">
                Capital recuperado vs. Interés compensatorio vs. Interés moratorio
              </p>
            </div>
            <Badge variant="emerald">Recaudado</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recaudacionBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="concepto" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="Monto" radius={[8, 8, 0, 0]}>
                  {recaudacionBars.map((entry) => (
                    <Cell key={entry.concepto} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0b3c5d]">Salud de Cartera Vigente</h2>
              <p className="text-xs text-[#64748b]">
                Proporción de cartera al día frente a cuotas vencidas en mora
              </p>
            </div>
            <Badge variant="navy">Base 360</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={carteraDonut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={4}
                >
                  <Cell fill="#0f9d75" />
                  <Cell fill="#ba1a1a" />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* TREA / TCEA Chart */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-[#00694d]" />
            <div>
              <h2 className="text-base font-bold text-[#0b3c5d]">
                Evolución de TCEA y TREA por Operación Emitida (%)
              </h2>
              <p className="text-xs text-[#64748b]">
                Tasas efectivas anuales calculadas mediante bisección numérica en el servidor
              </p>
            </div>
          </div>
        </div>

        {treaSeries.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#64748b]">
            No hay operaciones registradas para mostrar comparativa de tasas.
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={treaSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="credito" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis unit="%" tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="TREA" fill="#0f9d75" radius={[6, 6, 0, 0]} />
                <Bar dataKey="TCEA" fill="#0b3c5d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
