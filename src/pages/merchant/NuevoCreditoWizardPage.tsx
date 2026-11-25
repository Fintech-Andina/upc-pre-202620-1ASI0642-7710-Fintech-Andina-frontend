import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Lock,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { clientesApi, creditosApi, productosApi } from '@/api/endpoints';
import { extractApiErrorMessage } from '@/api/client';
import type {
  EmitirCreditoOutput,
  ModalidadCredito,
  Moneda,
  SimularCreditoOutput,
  TipoTasa,
} from '@/types/api';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField, inputBaseClass } from '@/components/ui/FormField';
import { PageLoader } from '@/components/ui/EmptyState';
import {
  BCRP_LIMITS_REF,
  formatDatePE,
  formatMoney,
  formatPercentFromDecimal,
  todayISO,
} from '@/utils/formatters';

type WizardStep = 1 | 2 | 3 | 4;

export function NuevoCreditoWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading: loadingCli } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientesApi.listar,
  });
  const { data: productos = [], isLoading: loadingProd } = useQuery({
    queryKey: ['productos'],
    queryFn: productosApi.listar,
  });

  const activeClientes = useMemo(() => clientes.filter((c) => c.activo), [clientes]);
  const activeProductos = useMemo(() => productos.filter((p) => p.activo !== false), [productos]);

  const [step, setStep] = useState<WizardStep>(1);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedProductoId, setSelectedProductoId] = useState<string>('');
  const [customMode, setCustomMode] = useState(false);
  const [precioContado, setPrecioContado] = useState<number>(0);
  const [precioLista, setPrecioLista] = useState<number>(0);

  // Step 2 operational terms
  const [modalidad, setModalidad] = useState<ModalidadCredito>('Cuotas');
  const [plazoMeses, setPlazoMeses] = useState<number>(6);
  const [fCompra, setFCompra] = useState<string>(() => todayISO());
  const [diasGraciaOverride, setDiasGraciaOverride] = useState<string>('');

  // What-If Simulation Mode (disables Confirm & Emit until restored)
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [whatIfMoneda, setWhatIfMoneda] = useState<Moneda>('PEN');
  const [whatIfTipoTasa, setWhatIfTipoTasa] = useState<TipoTasa>('Efectiva');
  const [whatIfTasaPct, setWhatIfTasaPct] = useState<number>(30);
  const [whatIfCap, setWhatIfCap] = useState<number>(12);

  // Server responses
  const [simResult, setSimResult] = useState<SimularCreditoOutput | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [emitResult, setEmitResult] = useState<EmitirCreditoOutput | null>(null);

  // Preselect client from query param or first active client
  useEffect(() => {
    if (activeClientes.length === 0) return;
    const fromUrl = searchParams.get('clienteId');
    if (fromUrl && activeClientes.some((c) => c.id === fromUrl)) {
      setSelectedClienteId(fromUrl);
    } else if (!selectedClienteId) {
      setSelectedClienteId(activeClientes[0].id);
    }
  }, [activeClientes, searchParams, selectedClienteId]);

  // Preselect first active product
  useEffect(() => {
    if (!customMode && !selectedProductoId && activeProductos.length > 0) {
      const p = activeProductos[0];
      setSelectedProductoId(p.id);
      setPrecioContado(p.precioContado);
      setPrecioLista(p.precioLista);
    }
  }, [activeProductos, customMode, selectedProductoId]);

  const selectedCliente = activeClientes.find((c) => c.id === selectedClienteId) ?? null;
  const selectedProducto = activeProductos.find((p) => p.id === selectedProductoId) ?? null;

  // Sync What-If defaults when client changes
  useEffect(() => {
    if (!selectedCliente) return;
    setWhatIfMode(false);
    setWhatIfMoneda(selectedCliente.moneda);
    setWhatIfTipoTasa(selectedCliente.tipoTasa);
    setWhatIfTasaPct(Number((selectedCliente.tasa * 100).toFixed(4)));
    setWhatIfCap(selectedCliente.capitalizacion);
    setPlazoMeses((prev) => Math.min(Math.max(1, prev), selectedCliente.maxMeses));
  }, [selectedCliente]);

  // Enforce product modality constraints when product changes
  useEffect(() => {
    if (customMode || !selectedProducto) return;
    setPrecioContado(selectedProducto.precioContado);
    setPrecioLista(selectedProducto.precioLista);
    if (!selectedProducto.permiteCuotas && selectedProducto.permitePagoUnico !== false) {
      setModalidad('PagoUnico');
    } else if (selectedProducto.permiteCuotas && selectedProducto.permitePagoUnico === false) {
      setModalidad('Cuotas');
    }
  }, [selectedProducto, customMode]);

  const cupoDisponible = selectedCliente
    ? selectedCliente.limiteCredito - selectedCliente.capitalVigente
    : 0;
  const exceedsLimit = Boolean(
    selectedCliente && precioLista > 0 && precioLista > cupoDisponible + 1e-6
  );

  // Effective simulation inputs (Contractual vs What-If)
  const effectiveMoneda = whatIfMode ? whatIfMoneda : selectedCliente?.moneda ?? 'PEN';
  const effectiveTipoTasa = whatIfMode ? whatIfTipoTasa : selectedCliente?.tipoTasa ?? 'Efectiva';
  const effectiveTasaDecimal = whatIfMode
    ? whatIfTasaPct / 100
    : selectedCliente?.tasa ?? 0.3;
  const effectiveCap = whatIfMode
    ? whatIfCap
    : selectedCliente?.capitalizacion ?? 12;

  const simMutation = useMutation({
    mutationFn: () => {
      if (!selectedCliente) throw new Error('Selecciona un cliente');
      return creditosApi.simular({
        precioLista,
        precioContado: precioContado > 0 ? precioContado : precioLista,
        moneda: effectiveMoneda,
        tipoTasa: effectiveTipoTasa,
        tasa: effectiveTasaDecimal,
        capitalizacion: effectiveCap,
        modalidad,
        plazoMeses: modalidad === 'PagoUnico' ? 1 : plazoMeses,
        diasGracia: diasGraciaOverride !== '' ? Number(diasGraciaOverride) : undefined,
        fCompra,
        diaCorte: selectedCliente.diaCorte,
        diaPago: selectedCliente.diaPago,
      });
    },
    onSuccess: (data) => {
      setSimResult(data);
      setSimError(null);
    },
    onError: (err) => {
      setSimResult(null);
      setSimError(extractApiErrorMessage(err));
    },
  });

  // Auto-simulate live preview on Step 2 when parameters change
  useEffect(() => {
    if (step !== 2 || !selectedCliente || precioLista <= 0) return;
    const timer = setTimeout(() => {
      simMutation.mutate();
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    step,
    selectedClienteId,
    precioLista,
    precioContado,
    modalidad,
    plazoMeses,
    fCompra,
    diasGraciaOverride,
    whatIfMode,
    whatIfMoneda,
    whatIfTipoTasa,
    whatIfTasaPct,
    whatIfCap,
  ]);

  const emitirMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCliente) throw new Error('Selecciona un cliente');
      if (whatIfMode) {
        throw new Error(
          'Desactiva el Modo Simulación What-If antes de confirmar la emisión real'
        );
      }
      return creditosApi.emitir({
        clienteId: selectedCliente.id,
        productoId: !customMode && selectedProducto ? selectedProducto.id : undefined,
        precioLista,
        precioContado: precioContado > 0 ? precioContado : precioLista,
        modalidad,
        plazoMeses: modalidad === 'PagoUnico' ? 1 : plazoMeses,
        diasGracia: diasGraciaOverride !== '' ? Number(diasGraciaOverride) : undefined,
        fCompra,
      });
    },
    onSuccess: (data) => {
      setEmitResult(data);
      setStep(4);
      toast.success('¡Crédito emitido y cronograma persistido exitosamente!');
      void queryClient.invalidateQueries({ queryKey: ['creditos'] });
      void queryClient.invalidateQueries({ queryKey: ['clientes'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      toast.error(extractApiErrorMessage(err));
    },
  });

  const restoreContractualAndResimulate = () => {
    if (!selectedCliente) return;
    setWhatIfMode(false);
    setWhatIfMoneda(selectedCliente.moneda);
    setWhatIfTipoTasa(selectedCliente.tipoTasa);
    setWhatIfTasaPct(Number((selectedCliente.tasa * 100).toFixed(4)));
    setWhatIfCap(selectedCliente.capitalizacion);
    // Trigger immediate simulation with contractual parameters
    creditosApi
      .simular({
        precioLista,
        precioContado: precioContado > 0 ? precioContado : precioLista,
        moneda: selectedCliente.moneda,
        tipoTasa: selectedCliente.tipoTasa,
        tasa: selectedCliente.tasa,
        capitalizacion: selectedCliente.capitalizacion,
        modalidad,
        plazoMeses: modalidad === 'PagoUnico' ? 1 : plazoMeses,
        diasGracia: diasGraciaOverride !== '' ? Number(diasGraciaOverride) : undefined,
        fCompra,
        diaCorte: selectedCliente.diaCorte,
        diaPago: selectedCliente.diaPago,
      })
      .then((res) => {
        setSimResult(res);
        setSimError(null);
        toast.success('Condiciones contractuales del cliente restauradas');
      })
      .catch((err) => toast.error(extractApiErrorMessage(err)));
  };

  if (loadingCli || loadingProd) {
    return <PageLoader label="Preparando asistente de emisión de crédito..." />;
  }

  const bcrp = BCRP_LIMITS_REF[effectiveMoneda];

  return (
    <div className="space-y-6">
      {/* Header + Stepper */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#00694d]">
            Créditos · Asistente de Emisión
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[#121d26]">Nuevo crédito</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3.5 py-1.5 text-xs font-medium text-[#3d4a43]">
          <ShieldCheck className="size-4 text-[#00694d]" />
          Límites Kv + PL &le; L verificados en servidor
        </div>
      </div>

      {step < 4 && (
        <Card className="no-print p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: 1, title: '1. Cliente y producto', sub: 'Cupo y precios Pc / PL' },
              { n: 2, title: '2. Condiciones financieras', sub: 'Plazos, tasa y topes BCRP' },
              { n: 3, title: '3. Cronograma y emisión', sub: 'Simulación real y pagaré' },
            ].map((item) => {
              const active = step === item.n;
              const done = step > item.n;
              return (
                <div
                  key={item.n}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    active
                      ? 'border-[#0f9d75] bg-[#ecfdf5]/60'
                      : done
                      ? 'border-[#a7f3d0] bg-white'
                      : 'border-[#e6ebf0] bg-[#f8fafc]'
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      active || done
                        ? 'bg-[#00694d] text-white'
                        : 'bg-[#e2e8f0] text-[#475569]'
                    }`}
                  >
                    {done ? '✓' : item.n}
                  </span>
                  <div className="hidden sm:block min-w-0">
                    <p className="truncate text-xs font-bold text-[#121d26]">{item.title}</p>
                    <p className="truncate text-[11px] text-[#64748b]">{item.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ==================== STEP 1 ==================== */}
      {step === 1 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            {/* Client Selection */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-[#0b3c5d]">
                  Identificación del Cliente (Titular de Línea)
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/clientes/nuevo')}
                >
                  + Registrar nuevo cliente
                </Button>
              </div>

              <FormField
                label="Seleccionar vecino activo"
                htmlFor="wiz-cliente"
                helpKey="wizard.clienteId"
                required
              >
                <select
                  id="wiz-cliente"
                  value={selectedClienteId}
                  onChange={(e) => setSelectedClienteId(e.target.value)}
                  className={inputBaseClass}
                >
                  {activeClientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreCompleto} · {c.tipoDoc} {c.numDoc} ({c.moneda})
                    </option>
                  ))}
                </select>
              </FormField>

              {selectedCliente && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#f4f7fa] p-4 text-xs">
                  <div>
                    <p className="text-[#64748b]">Línea aprobada (L)</p>
                    <p className="mt-0.5 text-sm font-bold text-[#121d26] tabular-nums">
                      {formatMoney(selectedCliente.limiteCredito, selectedCliente.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#64748b]">Capital vigente (Kv)</p>
                    <p className="mt-0.5 text-sm font-bold text-[#805200] tabular-nums">
                      {formatMoney(selectedCliente.capitalVigente, selectedCliente.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#64748b]">Cupo disponible (L - Kv)</p>
                    <p className="mt-0.5 text-sm font-bold text-[#00694d] tabular-nums">
                      {formatMoney(cupoDisponible, selectedCliente.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#64748b]">Ciclo pactado</p>
                    <p className="mt-0.5 text-sm font-bold text-[#0b3c5d]">
                      Corte {selectedCliente.diaCorte} · Pago {selectedCliente.diaPago}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Product / Amount Selection (NO STOCK) */}
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#0b3c5d]">
                    Bien o Servicio a Financiar
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Catálogo sin control ni bloqueo por stock/inventario.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0b3c5d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customMode}
                    onChange={(e) => setCustomMode(e.target.checked)}
                    className="size-4 accent-[#00694d]"
                  />
                  Ingresar monto libre (sin producto)
                </label>
              </div>

              {!customMode ? (
                <div className="space-y-4">
                  <FormField
                    label="Producto del catálogo"
                    htmlFor="wiz-prod"
                    helpKey="wizard.productoId"
                    required
                  >
                    <select
                      id="wiz-prod"
                      value={selectedProductoId}
                      onChange={(e) => setSelectedProductoId(e.target.value)}
                      className={inputBaseClass}
                    >
                      {activeProductos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} ({p.sku}) — PL {formatMoney(p.precioLista, selectedCliente?.moneda)}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {selectedProducto && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e6ebf0] bg-[#f8fafc] p-4">
                      <div className="space-y-1">
                        <p className="text-xs text-[#64748b]">
                          SKU: {selectedProducto.sku}
                          {selectedProducto.marca ? ` · Marca: ${selectedProducto.marca}` : ''}
                          {selectedProducto.unidadMedida
                            ? ` · Unidad: ${selectedProducto.unidadMedida}`
                            : ''}
                        </p>
                        <p className="text-sm font-bold text-[#121d26]">{selectedProducto.nombre}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedProducto.permitePagoUnico !== false && (
                            <Badge variant="navy">Pago Único</Badge>
                          )}
                          {selectedProducto.permiteCuotas && (
                            <Badge variant="emerald">Cuotas mensuales</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-right shrink-0">
                        <div>
                          <p className="text-[11px] text-[#64748b]">Precio Contado (Pc)</p>
                          <p className="text-base font-bold text-[#121d26] tabular-nums">
                            {formatMoney(selectedProducto.precioContado, selectedCliente?.moneda)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[#64748b]">Precio Lista (PL)</p>
                          <p className="text-base font-bold text-[#00694d] tabular-nums">
                            {formatMoney(selectedProducto.precioLista, selectedCliente?.moneda)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    label="Precio al Contado (Pc)"
                    htmlFor="wiz-pc"
                    helpKey="wizard.precioContado"
                    required
                  >
                    <input
                      id="wiz-pc"
                      type="number"
                      step="0.01"
                      value={precioContado}
                      onChange={(e) => setPrecioContado(Number(e.target.value))}
                      className={inputBaseClass}
                    />
                  </FormField>
                  <FormField
                    label="Precio de Lista / Monto a Financiar (PL)"
                    htmlFor="wiz-pl"
                    helpKey="wizard.precioLista"
                    required
                  >
                    <input
                      id="wiz-pl"
                      type="number"
                      step="0.01"
                      value={precioLista}
                      onChange={(e) => setPrecioLista(Number(e.target.value))}
                      className={inputBaseClass}
                    />
                  </FormField>
                </div>
              )}
            </Card>
          </div>

          {/* Right Summary */}
          <div className="xl:col-span-4 space-y-4">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#e6ebf0] pb-3">
                <h2 className="text-sm font-bold text-[#0b3c5d]">Validación de Cupo (F-17)</h2>
                <Badge variant="navy">PASO 1 / 3</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Precio al Contado (Pc):</span>
                  <strong className="tabular-nums">
                    {formatMoney(precioContado, selectedCliente?.moneda)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Capital solicitado (PL):</span>
                  <strong className="tabular-nums">
                    {formatMoney(precioLista, selectedCliente?.moneda)}
                  </strong>
                </div>
              </div>

              <div
                className={`rounded-xl p-4 border ${
                  exceedsLimit
                    ? 'border-[#fecaca] bg-[#fef2f2]'
                    : 'border-[#a7f3d0] bg-[#ecfdf5]'
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  Capacidad Crediticia (Kv + PL &le; L)
                </p>
                <p
                  className={`mt-1 text-2xl font-bold tabular-nums ${
                    exceedsLimit ? 'text-[#ba1a1a]' : 'text-[#00694d]'
                  }`}
                >
                  {formatMoney(precioLista, selectedCliente?.moneda)}
                </p>
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    exceedsLimit ? 'text-[#93000a]' : 'text-[#00694d]'
                  }`}
                >
                  {exceedsLimit
                    ? `Excede el cupo disponible (${formatMoney(cupoDisponible, selectedCliente?.moneda)})`
                    : 'Operación dentro de la línea disponible'}
                </p>
              </div>

              <Button
                className="w-full"
                disabled={!selectedCliente || precioLista <= 0 || exceedsLimit}
                onClick={() => setStep(2)}
              >
                Siguiente: Condiciones financieras
                <ArrowRight className="size-4" />
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== STEP 2 ==================== */}
      {step === 2 && selectedCliente && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <Card className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6ebf0] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#0b3c5d]">
                    Condiciones Contractuales y Operativas
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    La emisión real utiliza las condiciones pactadas en el expediente de{' '}
                    <strong>{selectedCliente.nombreCompleto}</strong>.
                  </p>
                </div>
                <Badge variant="emerald">
                  <Lock className="size-3" />
                  Contrato del cliente
                </Badge>
              </div>

              {/* Locked Contractual Parameters */}
              <div className="rounded-xl border border-[#dbe8f2] bg-[#f0f6fa] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0b3c5d]">
                    Parámetros Contractuales Fijos para Emisión Real
                  </span>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#805200] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatIfMode}
                      onChange={(e) => setWhatIfMode(e.target.checked)}
                      className="size-4 accent-[#b45309]"
                    />
                    <FlaskConical className="size-3.5" />
                    Modo Simulación What-If (solo prueba)
                  </label>
                </div>

                {!whatIfMode ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg bg-white p-2.5 border border-[#e6ebf0]">
                      <p className="text-[#64748b]">Moneda</p>
                      <p className="font-bold text-[#121d26]">{selectedCliente.moneda}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-[#e6ebf0]">
                      <p className="text-[#64748b]">Tasa Pactada</p>
                      <p className="font-bold text-[#00694d] tabular-nums">
                        {selectedCliente.tipoTasa} {formatPercentFromDecimal(selectedCliente.tasa)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-[#e6ebf0]">
                      <p className="text-[#64748b]">Capitalización</p>
                      <p className="font-bold text-[#121d26]">m = {selectedCliente.capitalizacion}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-[#e6ebf0]">
                      <p className="text-[#64748b]">Corte / Pago</p>
                      <p className="font-bold text-[#121d26]">
                        Día {selectedCliente.diaCorte} / Día {selectedCliente.diaPago}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-3 text-xs text-[#805200]">
                      <strong>Modo What-If Activo:</strong> Estás probando parámetros temporales.
                      Mientras esté activo, el botón <strong>Confirmar y Emitir Crédito</strong>{' '}
                      permanecerá deshabilitado en el Paso 3 para evitar discrepancias con el servidor.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <FormField label="Moneda (What-If)" helpKey="cliente.moneda">
                        <select
                          value={whatIfMoneda}
                          onChange={(e) => setWhatIfMoneda(e.target.value as Moneda)}
                          className={inputBaseClass}
                        >
                          <option value="PEN">PEN</option>
                          <option value="USD">USD</option>
                        </select>
                      </FormField>
                      <FormField label="Tipo tasa" helpKey="cliente.tipoTasa">
                        <select
                          value={whatIfTipoTasa}
                          onChange={(e) => setWhatIfTipoTasa(e.target.value as TipoTasa)}
                          className={inputBaseClass}
                        >
                          <option value="Efectiva">Efectiva (TEA)</option>
                          <option value="Nominal">Nominal (TNA)</option>
                        </select>
                      </FormField>
                      <FormField label="Tasa (%)" helpKey="cliente.tasa">
                        <input
                          type="number"
                          step="0.01"
                          value={whatIfTasaPct}
                          onChange={(e) => setWhatIfTasaPct(Number(e.target.value))}
                          className={inputBaseClass}
                        />
                      </FormField>
                      <FormField label="Cap. (m)" helpKey="cliente.capitalizacion">
                        <select
                          value={whatIfCap}
                          disabled={whatIfTipoTasa === 'Efectiva'}
                          onChange={(e) => setWhatIfCap(Number(e.target.value))}
                          className={inputBaseClass}
                        >
                          <option value={12}>12 (Mensual)</option>
                          <option value={360}>360 (Diaria)</option>
                        </select>
                      </FormField>
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Credit Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Modalidad de crédito" htmlFor="wiz-mod" helpKey="wizard.modalidad" required>
                  <select
                    id="wiz-mod"
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value as ModalidadCredito)}
                    className={inputBaseClass}
                  >
                    {(!selectedProducto || customMode || selectedProducto.permiteCuotas) && (
                      <option value="Cuotas">Cuotas mensuales (Método Francés)</option>
                    )}
                    {(!selectedProducto ||
                      customMode ||
                      selectedProducto.permitePagoUnico !== false) && (
                      <option value="PagoUnico">Pago Único a fin de mes</option>
                    )}
                  </select>
                </FormField>

                <FormField
                  label={`Plazo en cuotas (1 – ${selectedCliente.maxMeses} meses)`}
                  htmlFor="wiz-plazo"
                  helpKey="wizard.plazoMeses"
                  required
                >
                  <input
                    id="wiz-plazo"
                    type="number"
                    min={1}
                    max={selectedCliente.maxMeses}
                    disabled={modalidad === 'PagoUnico'}
                    value={modalidad === 'PagoUnico' ? 1 : plazoMeses}
                    onChange={(e) => setPlazoMeses(Number(e.target.value))}
                    className={inputBaseClass}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Fecha de compra / emisión"
                  htmlFor="wiz-fc"
                  helpKey="wizard.fCompra"
                  required
                >
                  <input
                    id="wiz-fc"
                    type="date"
                    value={fCompra}
                    onChange={(e) => setFCompra(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>

                <FormField
                  label="Días de gracia total g (opcional)"
                  htmlFor="wiz-gracia"
                  helpKey="wizard.diasGracia"
                  hint="Vacío = el motor calcula automáticamente según día de corte/pago"
                >
                  <input
                    id="wiz-gracia"
                    type="number"
                    min={0}
                    placeholder="Automático según ciclo"
                    value={diasGraciaOverride}
                    onChange={(e) => setDiasGraciaOverride(e.target.value)}
                    className={inputBaseClass}
                  />
                </FormField>
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" />
                Atrás: Cliente y producto
              </Button>
              <Button
                disabled={!simResult || Boolean(simError) || simMutation.isPending}
                onClick={() => setStep(3)}
              >
                Ver cronograma completo
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Right BCRP Verification + Live Server Preview */}
          <div className="xl:col-span-4 space-y-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0b3c5d]">
                  Verificación Topes BCRP ({effectiveMoneda})
                </h3>
                <Badge variant="navy">Ley N.° 31143</Badge>
              </div>
              <div className="rounded-xl bg-[#ecfdf5] p-3 text-xs text-[#00694d] space-y-1">
                <p className="font-semibold">
                  Tope Compensatorio {effectiveMoneda}: {bcrp.compensatorioMaxPct}.00% TEA
                </p>
                <p>Tope Moratorio {effectiveMoneda}: {bcrp.moratorioMaxPct}.00% TEA</p>
                {simResult && (
                  <p className="pt-1 font-bold">
                    TEA calculada por servidor: {(simResult.tea * 100).toFixed(2)}%
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#e6ebf0] pb-2.5">
                <h3 className="text-sm font-bold text-[#0b3c5d]">Resumen Preliminar</h3>
                <Badge variant="emerald">Motor Backend</Badge>
              </div>

              {simMutation.isPending && (
                <p className="py-6 text-center text-xs text-[#64748b]">
                  Calculando en el servidor...
                </p>
              )}

              {simError && (
                <div className="rounded-xl bg-[#ffdad6] p-3 text-xs font-semibold text-[#93000a]">
                  {simError}
                </div>
              )}

              {simResult && !simMutation.isPending && (
                <div className="space-y-2.5 text-xs">
                  <div className="rounded-xl bg-[#f4f7fa] p-3">
                    <p className="text-[#64748b]">Cuota referencial</p>
                    <p className="text-2xl font-bold text-[#00694d] tabular-nums">
                      {formatMoney(simResult.cuotaReferencial, simResult.moneda)}
                    </p>
                    <p className="text-[11px] text-[#64748b]">
                      {modalidad === 'PagoUnico'
                        ? `Pago único el ${formatDatePE(simResult.primeraFechaPago)}`
                        : `${plazoMeses} cuotas mensuales`}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Días de gracia (g):</span>
                    <strong className="tabular-nums">{simResult.diasGracia} días</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Capital capitalizado (P&apos;):</span>
                    <strong className="tabular-nums">
                      {formatMoney(simResult.capitalCapitalizado, simResult.moneda)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Total intereses:</span>
                    <strong className="tabular-nums">
                      {formatMoney(simResult.totalInteres, simResult.moneda)}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-[#e6ebf0] pt-2">
                    <span className="text-[#64748b]">Total a pagar:</span>
                    <strong className="text-sm text-[#121d26] tabular-nums">
                      {formatMoney(simResult.totalPagar, simResult.moneda)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#0b3c5d]">
                    <span>TCEA / TREA anual:</span>
                    <strong className="tabular-nums">{(simResult.tcea * 100).toFixed(4)}%</strong>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ==================== STEP 3 ==================== */}
      {step === 3 && selectedCliente && simResult && (
        <div className="space-y-6">
          {/* What-If Warning Guard */}
          {whatIfMode && (
            <Card className="no-print border-[#f59e0b] bg-[#fffbeb] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 shrink-0 text-[#b45309] mt-0.5" />
                  <div className="text-xs text-[#805200]">
                    <p className="font-bold text-sm">
                      Emisión bloqueada: Modo Simulación What-If activo
                    </p>
                    <p className="mt-0.5">
                      El cronograma actual usa parámetros hipotéticos de prueba. Para garantizar
                      coherencia exacta con <code className="font-mono">POST /api/creditos/emitir</code>,
                      restaura las condiciones contractuales del cliente.
                    </p>
                  </div>
                </div>
                <Button variant="navy" size="sm" onClick={restoreContractualAndResimulate}>
                  <RotateCcw className="size-3.5" />
                  Restaurar condiciones contractuales
                </Button>
              </div>
            </Card>
          )}

          {/* 5 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-[#64748b]">Monto Nominal (PL)</p>
              <p className="mt-1 text-lg font-bold text-[#121d26] tabular-nums">
                {formatMoney(simResult.precioLista, simResult.moneda)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-[#64748b]">Saldo tras Gracia (P&apos;)</p>
              <p className="mt-1 text-lg font-bold text-[#805200] tabular-nums">
                {formatMoney(simResult.capitalCapitalizado, simResult.moneda)}
              </p>
              <p className="text-[10.5px] text-[#64748b]">{simResult.diasGracia}d gracia total</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-[#64748b]">Cuota Referencial</p>
              <p className="mt-1 text-lg font-bold text-[#00694d] tabular-nums">
                {formatMoney(simResult.cuotaReferencial, simResult.moneda)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-[#64748b]">TCEA</p>
              <p className="mt-1 text-lg font-bold text-[#0b3c5d] tabular-nums">
                {(simResult.tcea * 100).toFixed(4)}%
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-[#64748b]">TREA</p>
              <p className="mt-1 text-lg font-bold text-[#0b3c5d] tabular-nums">
                {(simResult.trea * 100).toFixed(4)}%
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Schedule Table */}
            <Card className="print-area xl:col-span-8 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6ebf0] px-6 py-4">
                <div>
                  <h2 className="text-base font-bold text-[#0b3c5d]">
                    Cronograma de Pagos ({modalidad === 'PagoUnico' ? 'Pago Único' : 'Método Francés Ordinario'})
                  </h2>
                  <p className="text-xs text-[#64748b]">
                    Base 360 días / Mes comercial 30 días · Corte: {formatDatePE(simResult.fechaCorte)}
                    {simResult.diasGracia > 0 && modalidad === 'Cuotas'
                      ? ` · Fin de gracia (F0): ${formatDatePE(simResult.primeraFechaPago)}`
                      : ''}
                  </p>
                </div>
                <Badge variant="emerald">{simResult.moneda}</Badge>
              </div>

              <div className="table-region" role="region" tabIndex={0} aria-label="Cronograma simulado">
                <table>
                  <thead className="bg-[#f8fafc] text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                    <tr>
                      <th className="px-4 py-3">N.°</th>
                      <th className="px-4 py-3">Vencimiento</th>
                      <th className="px-4 py-3 text-right">Saldo Inicial</th>
                      <th className="px-4 py-3 text-right">Interés</th>
                      <th className="px-4 py-3 text-right">Amortización</th>
                      <th className="px-4 py-3 text-right">Cuota</th>
                      <th className="px-4 py-3 text-right">Saldo Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6ebf0] text-xs sm:text-sm">
                    {simResult.diasGracia > 0 && modalidad === 'Cuotas' && (
                      <tr className="bg-[#fffbeb]/60 text-[#805200]">
                        <td className="px-4 py-2.5 font-semibold">0 (Gracia)</td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {formatDatePE(simResult.primeraFechaPago)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {formatMoney(simResult.precioLista, simResult.moneda)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                          Cap. {simResult.diasGracia}d
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">0.00</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">0.00</td>
                        <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                          {formatMoney(simResult.capitalCapitalizado, simResult.moneda)}
                        </td>
                      </tr>
                    )}
                    {simResult.cronograma.map((row) => (
                      <tr key={row.k} className="hover:bg-[#f4f7fa]">
                        <td className="px-4 py-3 font-semibold">{row.k}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatDatePE(row.fechaVencimiento)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(row.saldoInicial, simResult.moneda)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(row.interes, simResult.moneda)}
                        </td>
                        <td className="px-4 py-3 text-right text-[#00694d] font-medium tabular-nums">
                          {formatMoney(row.amortizacion, simResult.moneda)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">
                          {formatMoney(row.cuota, simResult.moneda)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(row.saldoFinal, simResult.moneda)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#f8fafc] font-bold">
                      <td className="px-4 py-3" colSpan={3}>
                        TOTALES
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(simResult.totalInteres, simResult.moneda)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(simResult.totalAmortizacion, simResult.moneda)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#00694d] tabular-nums">
                        {formatMoney(simResult.totalPagar, simResult.moneda)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(0, simResult.moneda)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Right Donut & Compliance */}
            <div className="xl:col-span-4 space-y-4">
              <Card className="p-5">
                <h3 className="text-sm font-bold text-[#0b3c5d]">Distribución del Crédito</h3>
                <p className="text-xs text-[#64748b]">Capital nominal vs. Intereses totales</p>

                <div className="h-48 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Capital (PL)', value: simResult.precioLista },
                          {
                            name: 'Intereses',
                            value: Math.max(0, simResult.totalPagar - simResult.precioLista),
                          },
                        ]}
                        dataKey="value"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        <Cell fill="#0f9d75" />
                        <Cell fill="#0b3c5d" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-[#0f9d75]" />
                      Capital prestado (PL)
                    </span>
                    <strong className="tabular-nums">
                      {formatMoney(simResult.precioLista, simResult.moneda)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-[#0b3c5d]" />
                      Costo financiero total
                    </span>
                    <strong className="tabular-nums">
                      {formatMoney(simResult.totalPagar - simResult.precioLista, simResult.moneda)}
                    </strong>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-[#f0f6fa] text-xs text-[#3d4a43] space-y-1.5">
                <p className="font-bold text-[#0b3c5d]">Transparencia Metodológica</p>
                <p className="leading-relaxed">
                  Basado en buenas prácticas financieras y estándares de transparencia (referencia
                  metodológica BCRP / SBS y Ley N.° 31143).
                </p>
              </Card>
            </div>
          </div>

          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="size-4" />
              Modificar condiciones
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="size-4" />
                Imprimir / PDF
              </Button>
              <Button
                disabled={whatIfMode}
                loading={emitirMutation.isPending}
                onClick={() => emitirMutation.mutate()}
              >
                <CheckCircle2 className="size-4" />
                Confirmar y Emitir Crédito
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== STEP 4: CONFIRMATION ==================== */}
      {step === 4 && emitResult && (
        <Card className="mx-auto max-w-2xl p-8 text-center space-y-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#ecfdf5] text-[#00694d]">
            <Sparkles className="size-8" />
          </div>

          <div className="space-y-1">
            <Badge variant="emerald">Operación Persistida en Base de Datos</Badge>
            <h2 className="text-2xl font-bold text-[#121d26]">¡Crédito Emitido Exitosamente!</h2>
            <p className="text-sm text-[#64748b]">
              El cronograma de {emitResult.cuotas.length} cuota(s) y el nuevo capital vigente fueron
              registrados con éxito.
            </p>
          </div>

          <div className="rounded-xl bg-[#f4f7fa] p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left text-xs">
            <div>
              <p className="text-[#64748b]">Monto PL</p>
              <p className="mt-0.5 text-sm font-bold text-[#121d26] tabular-nums">
                {formatMoney(emitResult.credito.precioLista, emitResult.credito.moneda)}
              </p>
            </div>
            <div>
              <p className="text-[#64748b]">Cuota Referencial</p>
              <p className="mt-0.5 text-sm font-bold text-[#00694d] tabular-nums">
                {formatMoney(emitResult.credito.cuota, emitResult.credito.moneda)}
              </p>
            </div>
            <div>
              <p className="text-[#64748b]">Nuevo Kv</p>
              <p className="mt-0.5 text-sm font-bold text-[#121d26] tabular-nums">
                {formatMoney(emitResult.nuevoCapitalVigente, emitResult.credito.moneda)}
              </p>
            </div>
            <div>
              <p className="text-[#64748b]">Cupo Disponible</p>
              <p className="mt-0.5 text-sm font-bold text-[#0b3c5d] tabular-nums">
                {formatMoney(emitResult.lineaDisponible, emitResult.credito.moneda)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/creditos/${emitResult.credito.id}`)}
            >
              Ver detalle y cronograma
            </Button>
            <Button
              onClick={() => {
                setEmitResult(null);
                setStep(1);
              }}
            >
              Emitir otro crédito
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
