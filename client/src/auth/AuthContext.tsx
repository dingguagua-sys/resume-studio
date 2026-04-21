import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "../api/client";

export type User = { id: string; email: string; displayName: string };
const DEFAULT_LOGIN_EMAIL = "yyx1853100";
const DEFAULT_LOGIN_PASSWORD = "123456";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("resume_studio_token"));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("resume_studio_token");
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        try {
          const { data } = await api.post<{ token: string; user: User }>("auth/login", {
            email: DEFAULT_LOGIN_EMAIL,
            password: DEFAULT_LOGIN_PASSWORD,
          });
          if (cancelled) return;
          localStorage.setItem("resume_studio_token", data.token);
          setToken(data.token);
          setUser(data.user);
        } catch {
          if (!cancelled) setLoading(false);
        }
        return;
      }
      try {
        const { data } = await api.get<{ user: User }>("me");
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>("auth/login", { email, password });
    localStorage.setItem("resume_studio_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const { data } = await api.post<{ token: string; user: User }>("auth/register", {
      email,
      password,
      displayName,
    });
    localStorage.setItem("resume_studio_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
