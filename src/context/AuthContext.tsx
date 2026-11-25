import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, type RegisterTiendaPayload } from '@/api/endpoints';
import { getStoredToken, setStoredToken, subscribeUnauthorized } from '@/api/client';
import type { AuthUserPayload, Cliente, RolUsuario, Tienda } from '@/types/api';

interface AuthContextValue {
  token: string | null;
  user: AuthUserPayload | null;
  tienda: Tienda | null;
  cliente: Cliente | null;
  rol: RolUsuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<RolUsuario>;
  loginCliente: (identifier: string, password: string) => Promise<RolUsuario>;
  register: (payload: RegisterTiendaPayload) => Promise<RolUsuario>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUserPayload | null>(null);
  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredToken()));

  const clearSession = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setTienda(null);
    setCliente(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const activeToken = getStoredToken();
    if (!activeToken) {
      clearSession();
      setIsLoading(false);
      return;
    }

    try {
      const me = await authApi.me();
      setToken(activeToken);
      setUser(me.usuario);
      setTienda(me.tienda ?? null);
      setCliente(me.cliente ?? null);
    } catch {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    return subscribeUnauthorized(() => {
      clearSession();
    });
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string): Promise<RolUsuario> => {
    const res = await authApi.login({ email, password });
    setStoredToken(res.token);
    setToken(res.token);
    setTienda(res.tienda ?? null);
    setCliente(res.cliente ?? null);
    const me = await authApi.me();
    setUser(me.usuario);
    setTienda(me.tienda ?? res.tienda ?? null);
    setCliente(me.cliente ?? res.cliente ?? null);
    return res.rol;
  }, []);

  const loginCliente = useCallback(async (identifier: string, password: string): Promise<RolUsuario> => {
    const clean = identifier.trim();
    const isEmail = clean.includes('@');
    const res = await authApi.loginCliente(
      isEmail ? { email: clean, password } : { numDoc: clean, password }
    );
    setStoredToken(res.token);
    setToken(res.token);
    setCliente(res.cliente ?? null);
    setTienda(null);
    const me = await authApi.me();
    setUser(me.usuario);
    setCliente(me.cliente ?? res.cliente ?? null);
    return res.rol;
  }, []);

  const register = useCallback(async (payload: RegisterTiendaPayload): Promise<RolUsuario> => {
    const res = await authApi.register(payload);
    setStoredToken(res.token);
    setToken(res.token);
    setTienda(res.tienda ?? null);
    const me = await authApi.me();
    setUser(me.usuario);
    setTienda(me.tienda ?? res.tienda ?? null);
    return res.rol;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        tienda,
        cliente,
        rol: user?.rol ?? null,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        loginCliente,
        register,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
