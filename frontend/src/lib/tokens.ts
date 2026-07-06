/** Persistent JWT + user storage (localStorage), plus a tiny pub/sub so the
 *  auth context reacts to token changes (e.g. an interceptor logging the user
 *  out after a failed refresh). */
import type { User } from "@/types/api";

const ACCESS = "aeo.access";
const REFRESH = "aeo.refresh";
const USER = "aeo.user";
const ORG = "aeo.currentOrg";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export const tokenStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getAccess(): string | null {
    return localStorage.getItem(ACCESS);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  getCurrentOrgId(): string | null {
    return localStorage.getItem(ORG);
  },

  setSession(access: string, refresh: string, user: User) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
    localStorage.setItem(USER, JSON.stringify(user));
    emit();
  },
  setAccess(access: string) {
    localStorage.setItem(ACCESS, access);
  },
  setUser(user: User) {
    localStorage.setItem(USER, JSON.stringify(user));
    emit();
  },
  setCurrentOrgId(id: string | null) {
    if (id === null) localStorage.removeItem(ORG);
    else localStorage.setItem(ORG, id);
    emit();
  },

  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
    // Deliberately keep ORG selection so re-login lands on the same org.
    emit();
  },
};
