import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { orgApi } from "@/lib/api";
import { tokenStore } from "@/lib/tokens";
import { useAuth } from "./AuthContext";
import type { Organization } from "@/types/api";

interface OrgCtx {
  orgs: Organization[];
  currentOrg: Organization | null;
  loading: boolean;
  error: string | null;
  selectOrg: (id: string | number) => void;
  refresh: () => Promise<Organization[]>;
}

const Ctx = createContext<OrgCtx | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(() => tokenStore.getCurrentOrgId());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await orgApi.list();
      setOrgs(list);
      // Reconcile the persisted selection with what the user still belongs to.
      const savedId = tokenStore.getCurrentOrgId();
      const stillValid = savedId && list.some((o) => String(o.id) === savedId);
      if (stillValid) {
        setCurrentId(savedId);
      } else if (list.length > 0) {
        const first = String(list[0].id);
        tokenStore.setCurrentOrgId(first);
        setCurrentId(first);
      } else {
        setCurrentId(null);
      }
      return list;
    } catch (e) {
      setError("Could not load your organizations.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refresh();
    } else {
      setOrgs([]);
      setCurrentId(null);
    }
  }, [isAuthenticated, refresh]);

  const selectOrg = useCallback((id: string | number) => {
    const sid = String(id);
    tokenStore.setCurrentOrgId(sid);
    setCurrentId(sid);
  }, []);

  const currentOrg = useMemo(
    () => orgs.find((o) => String(o.id) === currentId) ?? null,
    [orgs, currentId],
  );

  const value = useMemo<OrgCtx>(
    () => ({ orgs, currentOrg, loading, error, selectOrg, refresh }),
    [orgs, currentOrg, loading, error, selectOrg, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrg(): OrgCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
