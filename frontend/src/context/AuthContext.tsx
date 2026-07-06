import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api";
import { AUTH_LOGOUT_EVENT } from "@/lib/http";
import { tokenStore } from "@/lib/tokens";
import type { User } from "@/types/api";

interface AuthCtx {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<User>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => tokenStore.getUser());
  const [loading, setLoading] = useState<boolean>(() => !!tokenStore.getAccess());

  // Revalidate the session on mount if we have a token but want fresh user data.
  useEffect(() => {
    let active = true;
    if (tokenStore.getAccess()) {
      authApi
        .me()
        .then((u) => {
          if (!active) return;
          tokenStore.setUser(u);
          setUser(u);
        })
        .catch(() => {
          /* interceptor handles refresh/logout */
        })
        .finally(() => active && setLoading(false));
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, []);

  // React to a forced logout dispatched by the axios interceptor.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    tokenStore.setSession(res.access, res.refresh, res.user);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, full_name?: string) => {
      const created = await authApi.register({ email, password, full_name });
      // Auto-login after successful registration for a smooth first run.
      const res = await authApi.login({ email, password });
      tokenStore.setSession(res.access, res.refresh, res.user);
      setUser(res.user);
      return created;
    },
    [],
  );

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {
        /* best-effort revoke */
      }
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, isAuthenticated: !!user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
