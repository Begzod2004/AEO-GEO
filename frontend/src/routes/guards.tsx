import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { LogoMark } from "@/components/brand/Logo";

function Splash({ label }: { label: string }) {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <LogoMark className="h-9 w-11" />
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
      </div>
    </div>
  );
}

/** Requires a valid session; otherwise redirects to /login (preserving intent). */
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash label="Tuning in…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Requires a selected organization; otherwise routes to onboarding. */
export function RequireOrg() {
  const { currentOrg, loading, orgs } = useOrg();
  if (loading && orgs.length === 0) return <Splash label="Loading workspace…" />;
  if (!currentOrg) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Sends already-authenticated users away from auth pages. */
export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Splash label="Tuning in…" />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}


/** Superusers only — everyone else goes back to the app. */
export function RequireSuperuser() {
  const { user, loading } = useAuth();
  if (loading) return <Splash label="Tuning in…" />;
  if (!user?.is_superuser) return <Navigate to="/" replace />;
  return <Outlet />;
}
