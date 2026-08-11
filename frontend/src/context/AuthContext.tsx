import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "../api/client";
import type { AuthResponse, User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  activate: (token: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ data: User }>("/auth/me")
      .then((res) => setUser(res.data.data))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ data: AuthResponse }>("/auth/login", { email, password });
    setToken(res.data.data.accessToken);
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const activate = useCallback(async (token: string, password: string) => {
    const res = await api.post<{ data: AuthResponse }>("/auth/activate", { token, password });
    setToken(res.data.data.accessToken);
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  useEffect(() => {
    const w = window as unknown as { __onUnauthorized?: () => void };
    w.__onUnauthorized = logout;
    return () => {
      delete w.__onUnauthorized;
    };
  }, [logout]);

  const value = useMemo(
    () => ({ user, loading, login, activate, logout }),
    [user, loading, login, activate, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
