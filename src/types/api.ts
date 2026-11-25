export type Moneda = 'PEN' | 'USD';
export type TipoTasa = 'Efectiva' | 'Nominal';
export type ModalidadCredito = 'Cuotas' | 'PagoUnico';
export type RolUsuario = 'ADMIN_SISTEMA' | 'ADMIN_NEGOCIO' | 'CLIENTE';
export type TipoDocumento = 'DNI' | 'CE' | 'RUC';
export type EstadoCredito = 'Activo' | 'Cancelado' | 'Vencido';
export type EstadoCuota = 'Pendiente' | 'Pagada' | 'Vencida';
export type TipoPeriodoCuota = 'Gracia' | 'Amortizacion' | 'PagoUnico';

export interface ApiSuccessResponse<T> {
  status: 'success';
  mensaje?: string;
  cantidad?: number;
  data: T;
}

export interface ApiErrorResponse {
  status: 'error';
  code?: string;
  message: string;
  details?: Array<{ field?: string; message: string }>;
}

export interface Tienda {
  id: string;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  monedaDefecto: Moneda;
  horaCorte: number;
  creadoEn: string;
  razonSocial?: string;
  nombreComercial?: string;
  email?: string;
  rol?: 'ADMIN_SISTEMA' | 'ADMIN_NEGOCIO';
  estado?: 'ACTIVO' | 'INACTIVO' | string;
}

export interface Cliente {
  id: string;
  tiendaId?: string;
  nombreCompleto: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  tipoDoc: TipoDocumento;
  numDoc: string;
  ingresosNetos: number;
  moneda: Moneda;
  tipoTasa: TipoTasa;
  tasa: number;
  capitalizacion: number;
  teaMora: number;
  diaCorte: number;
  diaPago: number;
  limiteCredito: number;
  capitalVigente: number;
  maxMeses: number;
  activo: boolean;
  creadoEn: string;
}

export interface Producto {
  id: string;
  tiendaId: string;
  sku: string;
  nombre: string;
  marca?: string;
  proveedor?: string;
  descripcion?: string;
  unidadMedida?: string;
  imagenUrl?: string;
  precioLista: number;
  precioContado: number;
  permiteCuotas: boolean;
  permitePagoUnico?: boolean;
  activo?: boolean;
  stock?: number;
  creadoEn: string;
}

export interface Credito {
  id: string;
  clienteId: string;
  tiendaId: string;
  productoId?: string;
  moneda: Moneda;
  modalidad: ModalidadCredito;
  precioLista: number;
  precioContado: number;
  tipoTasa: TipoTasa;
  valorTasa: number;
  capitalizacion: number;
  tea: number;
  tem: number;
  teaMora: number;
  plazoMeses: number;
  diasGracia: number;
  capitalCapitalizado: number;
  cuota: number;
  tcea: number;
  trea: number;
  fechaEmision: string;
  fechaCorte: string;
  primeraFechaPago: string;
  fechaVencimiento: string;
  estado: EstadoCredito;
  creadoEn: string;
}

export interface Cuota {
  id: string;
  creditoId: string;
  clienteId: string;
  numero: number;
  tipoPeriodo: TipoPeriodoCuota;
  saldoInicial: number;
  interes: number;
  amortizacion: number;
  cuota: number;
  saldoFinal: number;
  fechaVencimiento: string;
  tK: number;
  estado: EstadoCuota;
  diasMora: number;
  interesMoratorio: number;
  totalPagado: number;
  fechaPago?: string;
}

export interface Pago {
  id: string;
  cuotaId: string;
  creditoId: string;
  clienteId: string;
  fechaPago: string;
  montoPagado: number;
  diasMora: number;
  interesMoratorio: number;
  interesCompensatorio: number;
  amortizacionCapital: number;
  metodoPago?: string;
  creadoEn: string;
}

export interface AuthUserPayload {
  id: string;
  rol: RolUsuario;
  tiendaId?: string;
  clienteId?: string;
  email?: string;
  ruc?: string;
  nombre?: string;
}

export interface AuthLoginResponse {
  token: string;
  rol: RolUsuario;
  tienda?: Tienda;
  cliente?: Cliente;
}

export interface AuthMeResponse {
  usuario: AuthUserPayload;
  tienda?: Tienda | null;
  cliente?: Cliente | null;
}

export interface FilaCronogramaSimulada {
  k: number;
  fechaVencimiento: string;
  saldoInicial: number;
  interes: number;
  amortizacion: number;
  cuota: number;
  saldoFinal: number;
  tK: number;
}

export interface SimularCreditoInput {
  precioLista: number;
  precioContado?: number;
  moneda: Moneda;
  tipoTasa: TipoTasa;
  tasa: number;
  capitalizacion?: number;
  modalidad: ModalidadCredito;
  plazoMeses: number;
  diasGracia?: number;
  fCompra?: string;
  diaCorte: number;
  diaPago: number;
  horaCorte?: number;
}

export interface SimularCreditoOutput {
  precioLista: number;
  precioContado: number;
  moneda: Moneda;
  modalidad: ModalidadCredito;
  tea: number;
  tem: number;
  diasGracia: number;
  fechaCorte: string;
  primeraFechaPago: string;
  capitalCapitalizado: number;
  cuotaReferencial: number;
  totalInteres: number;
  totalAmortizacion: number;
  totalPagar: number;
  tcea: number;
  trea: number;
  cronograma: FilaCronogramaSimulada[];
}

export interface EmitirCreditoInput {
  clienteId: string;
  tiendaId?: string;
  productoId?: string;
  precioLista?: number;
  precioContado?: number;
  modalidad: ModalidadCredito;
  plazoMeses?: number;
  diasGracia?: number;
  fCompra?: string;
  usuario?: string;
}

export interface EmitirCreditoOutput {
  credito: Credito;
  cuotas: Cuota[];
  nuevoCapitalVigente: number;
  lineaDisponible: number;
}

export interface DetalleFilaEstadoCuenta {
  cuotaId: string;
  creditoId: string;
  numeroCuota: number;
  fechaVencimiento: string;
  saldoInicial: number;
  amortizacion: number;
  interesCompensatorio: number;
  cuotaBase: number;
  diasMora: number;
  interesMoratorio: number;
  totalExigible: number;
  estado: string;
}

export interface EstadoCuentaOutput {
  cliente: {
    id: string;
    nombreCompleto: string;
    tipoDoc: string;
    numDoc: string;
    moneda: Moneda;
    limiteCredito: number;
    capitalVigente: number;
    lineaDisponible: number;
    diaCorte: number;
    diaPago: number;
    teaCompensatoria: number;
    teaMoratoria: number;
  };
  ciclo: {
    fechaCorte: string;
    fechaPagoOportuno: string;
    diasGraciaCiclo: number;
  };
  resumenLiquidacion: {
    totalCapitalCiclo: number;
    totalInteresCiclo: number;
    subtotalCiclo: number;
    totalDeudaVencidaAnterior: number;
    totalInteresMoratorio: number;
    totalExigibleHoy: number;
  };
  cuotasCicloActual: DetalleFilaEstadoCuenta[];
  cuotasVencidasAnteriores: DetalleFilaEstadoCuenta[];
  cuotasFuturas: DetalleFilaEstadoCuenta[];
  historialPagadas: Cuota[];
}

export interface PrevisualizarPagoInput {
  clienteId: string;
  cuotaIds?: string[];
  fPago?: string;
}

export interface PrevisualizarPagoOutput {
  clienteId: string;
  moneda: Moneda;
  teaMora: number;
  fechaPago: string;
  totalExigibleBase: number;
  totalInteresMoratorio: number;
  totalExigible: number;
  imputacionEstimada: {
    moratorio: number;
    compensatorio: number;
    capital: number;
  };
  filas: Array<{
    cuotaId: string;
    creditoId: string;
    k: number;
    fechaVencimiento: string;
    cuotaBase: number;
    diasMora: number;
    interesMoratorio: number;
    totalCuotaConMora: number;
    imputacion: {
      moratorio: number;
      compensatorio: number;
      capital: number;
    };
  }>;
}

export interface LiquidarPagoInput {
  clienteId: string;
  cuotaIds?: string[];
  fPago?: string;
  montoRecibido: number;
  metodoPago?: string;
  usuario?: string;
}

export interface LiquidarPagoOutput {
  pagoRegistrado: {
    clienteId: string;
    totalExigibleBase: number;
    totalInteresMoratorio: number;
    totalPagado: number;
    fechaPago: string;
  };
  imputacionLegal: {
    moratorio: number;
    compensatorio: number;
    capital: number;
  };
  cuotasAfectadas: Cuota[];
  nuevoCapitalVigente: number;
  lineaDisponible: number;
  pagos: Pago[];
}

export interface DashboardReporteOutput {
  resumenCartera: {
    totalCapitalColocado: number;
    carteraVigenteActiva: number;
    carteraVencidaEnMora: number;
    ratioMorosidadPct: number;
    treaPromedioPonderadaPct: number;
  };
  recaudacion: {
    totalRecaudado: number;
    totalCapitalRecuperado: number;
    totalInteresCompensatorioRecaudado: number;
    totalInteresMoratorioRecaudado: number;
  };
  volumenOperativo: {
    totalClientes: number;
    totalCreditosEmitidos: number;
    totalCreditosActivos: number;
    totalCuotasEmitidas: number;
    totalCuotasPagadas: number;
  };
}
