import axios from 'axios';
import { API_BASE_URL, apiClient } from './client';
import type {
  ApiSuccessResponse,
  AuthLoginResponse,
  AuthMeResponse,
  Cliente,
  Credito,
  Cuota,
  DashboardReporteOutput,
  EmitirCreditoInput,
  EmitirCreditoOutput,
  EstadoCuentaOutput,
  LiquidarPagoInput,
  LiquidarPagoOutput,
  Moneda,
  Pago,
  PrevisualizarPagoInput,
  PrevisualizarPagoOutput,
  Producto,
  SimularCreditoInput,
  SimularCreditoOutput,
  Tienda,
  TipoDocumento,
  TipoTasa,
} from '@/types/api';

export interface RegisterTiendaPayload {
  ruc: string;
  razonSocial?: string;
  nombreComercial?: string;
  nombre?: string;
  direccion: string;
  telefono?: string;
  email: string;
  password: string;
  rol?: 'ADMIN_NEGOCIO' | 'ADMIN_SISTEMA';
  monedaDefecto?: Moneda;
  horaCorte?: number;
}

export interface CrearClientePayload {
  nombreCompleto: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  password?: string;
  tipoDoc: TipoDocumento;
  numDoc: string;
  ingresosNetos: number;
  moneda: Moneda;
  tipoTasa: TipoTasa;
  tasa: number;
  capitalizacion?: number;
  teaMora: number;
  diaCorte: number;
  diaPago: number;
  limiteCredito: number;
  maxMeses: number;
}

export type ActualizarClientePayload = Partial<CrearClientePayload> & { activo?: boolean };

export interface CrearProductoPayload {
  sku?: string;
  nombre: string;
  marca?: string;
  proveedor?: string;
  descripcion?: string;
  unidadMedida?: string;
  imagenUrl?: string;
  precioContado: number;
  precioLista: number;
  permiteCuotas?: boolean;
  permitePagoUnico?: boolean;
  activo?: boolean;
}

export type ActualizarProductoPayload = Partial<CrearProductoPayload>;

export interface ActualizarMiTiendaPayload {
  razonSocial?: string;
  nombreComercial?: string;
  nombre?: string;
  direccion?: string;
  telefono?: string;
  monedaDefecto?: Moneda;
  horaCorte?: number;
}

export const authApi = {
  async login(payload: { email: string; password: string }): Promise<AuthLoginResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthLoginResponse>>('/auth/login', payload);
    return data.data;
  },
  async loginCliente(payload: {
    email?: string;
    numDoc?: string;
    password: string;
  }): Promise<AuthLoginResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthLoginResponse>>(
      '/auth/login-cliente',
      payload
    );
    return data.data;
  },
  async register(payload: RegisterTiendaPayload): Promise<AuthLoginResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthLoginResponse>>(
      '/auth/register',
      payload
    );
    return data.data;
  },
  async registerAsAdmin(payload: RegisterTiendaPayload): Promise<AuthLoginResponse> {
    // Use standalone axios call without touching current Superadmin session token
    const { data } = await axios.post<ApiSuccessResponse<AuthLoginResponse>>(
      `${API_BASE_URL}/auth/register`,
      payload
    );
    return data.data;
  },
  async me(): Promise<AuthMeResponse> {
    const { data } = await apiClient.get<ApiSuccessResponse<AuthMeResponse>>('/auth/me');
    return data.data;
  },
};

export const tiendasApi = {
  async listar(): Promise<Tienda[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Tienda[]>>('/tiendas');
    return data.data;
  },
  async cambiarEstado(id: string, estado: 'ACTIVO' | 'INACTIVO'): Promise<Tienda> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Tienda>>(`/tiendas/${id}/estado`, {
      estado,
    });
    return data.data;
  },
  async actualizarMiTienda(payload: ActualizarMiTiendaPayload): Promise<Tienda> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Tienda>>('/tiendas/mi-tienda', payload);
    return data.data;
  },
};

export const clientesApi = {
  async listar(): Promise<Cliente[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Cliente[]>>('/clientes');
    return data.data;
  },
  async obtenerPorId(id: string): Promise<Cliente> {
    const { data } = await apiClient.get<ApiSuccessResponse<Cliente>>(`/clientes/${id}`);
    return data.data;
  },
  async crear(payload: CrearClientePayload): Promise<Cliente> {
    const { data } = await apiClient.post<ApiSuccessResponse<Cliente>>('/clientes', payload);
    return data.data;
  },
  async actualizar(id: string, payload: ActualizarClientePayload): Promise<Cliente> {
    const { data } = await apiClient.put<ApiSuccessResponse<Cliente>>(`/clientes/${id}`, payload);
    return data.data;
  },
  async cambiarEstado(id: string, activo: boolean): Promise<Cliente> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Cliente>>(`/clientes/${id}/estado`, {
      activo,
    });
    return data.data;
  },
  async estadoCuenta(id: string, fCorte?: string): Promise<EstadoCuentaOutput> {
    const { data } = await apiClient.get<ApiSuccessResponse<EstadoCuentaOutput>>(
      `/clientes/${id}/estado-cuenta`,
      { params: fCorte ? { fCorte } : undefined }
    );
    return data.data;
  },
};

export const productosApi = {
  async listar(): Promise<Producto[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Producto[]>>('/productos');
    return data.data;
  },
  async obtenerPorId(id: string): Promise<Producto> {
    const { data } = await apiClient.get<ApiSuccessResponse<Producto>>(`/productos/${id}`);
    return data.data;
  },
  async crear(payload: CrearProductoPayload): Promise<Producto> {
    const { data } = await apiClient.post<ApiSuccessResponse<Producto>>('/productos', payload);
    return data.data;
  },
  async actualizar(id: string, payload: ActualizarProductoPayload): Promise<Producto> {
    const { data } = await apiClient.put<ApiSuccessResponse<Producto>>(`/productos/${id}`, payload);
    return data.data;
  },
  async cambiarEstado(id: string, activo: boolean): Promise<Producto> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Producto>>(`/productos/${id}/estado`, {
      activo,
    });
    return data.data;
  },
};

export const creditosApi = {
  async simular(payload: SimularCreditoInput): Promise<SimularCreditoOutput> {
    const { data } = await apiClient.post<ApiSuccessResponse<SimularCreditoOutput>>(
      '/creditos/simular',
      payload
    );
    return data.data;
  },
  async emitir(payload: EmitirCreditoInput): Promise<EmitirCreditoOutput> {
    const { data } = await apiClient.post<ApiSuccessResponse<EmitirCreditoOutput>>(
      '/creditos/emitir',
      payload
    );
    return data.data;
  },
  async listar(): Promise<Credito[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Credito[]>>('/creditos');
    return data.data;
  },
  async obtenerPorId(id: string): Promise<{ credito: Credito; cuotas: Cuota[] }> {
    const { data } = await apiClient.get<ApiSuccessResponse<{ credito: Credito; cuotas: Cuota[] }>>(
      `/creditos/${id}`
    );
    return data.data;
  },
};

export const pagosApi = {
  async previsualizar(payload: PrevisualizarPagoInput): Promise<PrevisualizarPagoOutput> {
    const { data } = await apiClient.post<ApiSuccessResponse<PrevisualizarPagoOutput>>(
      '/pagos/previsualizar',
      payload
    );
    return data.data;
  },
  async liquidar(payload: LiquidarPagoInput): Promise<LiquidarPagoOutput> {
    const { data } = await apiClient.post<ApiSuccessResponse<LiquidarPagoOutput>>(
      '/pagos/liquidar',
      payload
    );
    return data.data;
  },
  async listarPorCliente(clienteId: string): Promise<Pago[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Pago[]>>(`/pagos/cliente/${clienteId}`);
    return data.data;
  },
};

export const reportesApi = {
  async dashboard(): Promise<DashboardReporteOutput> {
    const { data } = await apiClient.get<ApiSuccessResponse<DashboardReporteOutput>>(
      '/reportes/dashboard'
    );
    return data.data;
  },
};

export const healthApi = {
  async check(): Promise<{
    status: string;
    app: string;
    version: string;
    organizacion: string;
    timestamp: string;
  }> {
    const { data } = await apiClient.get('/health');
    return data;
  },
};
