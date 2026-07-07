import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useApiData } from "@/hooks/useApiData";
import { platformApi } from "@/lib/api";
import { formatDate } from "@/lib/format";

type Tab = "overview" | "leads" | "users" | "orgs" | "audit";

const TABS: { value: Tab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "leads", label: "Waitlist" },
  { value: "users", label: "Users" },
  { value: "orgs", label: "Organizations" },
  { value: "audit", label: "Audit" },
];

/** Super Admin monitoring panel — platform-wide stats, waitlist signups,
 *  users/orgs and the audit feed. Read-only; CRUD lives in Django admin. */
export function AdminPanelPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge tone="brand">Platform admin</Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">{user?.email}</span>
            <Link to="/" className="text-brand hover:underline">
              App
            </Link>
            <a
              href="/admin/"
              onClick={(e) => {
                e.preventDefault();
                window.open("http://localhost:8000/admin/", "_blank");
              }}
              className="text-brand hover:underline"
            >
              Django admin ↗
            </a>
            <button onClick={() => logout()} className="text-muted hover:text-text">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Segmented
          segments={TABS}
          value={tab}
          onChange={setTab}
          ariaLabel="Admin sections"
          className="mb-8"
        />
        {tab === "overview" && <OverviewTab />}
        {tab === "leads" && <LeadsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "orgs" && <OrgsTab />}
        {tab === "audit" && <AuditTab />}
      </main>
    </div>
  );
}

/* ------------------------------ Overview ------------------------------ */

const SERIES: { key: "signups" | "leads" | "scans"; label: string; color: string }[] = [
  { key: "signups", label: "Signups", color: "#7C6BFF" },
  { key: "leads", label: "Waitlist", color: "#2DD4BF" },
  { key: "scans", label: "Scans", color: "#F59E0B" },
];

function OverviewTab() {
  const { data, loading, error } = useApiData(() => platformApi.overview(), []);

  if (loading) return <PanelSkeleton />;
  if (error || !data)
    return <Card className="p-8"><EmptyState title="Couldn't load stats" description={error ?? ""} /></Card>;

  const t = data.totals;
  const w = data.last_7_days;
  const stats: { label: string; value: number; sub?: string }[] = [
    { label: "Users", value: t.users, sub: `+${w.new_users} this week` },
    { label: "Waitlist leads", value: t.leads, sub: `+${w.new_leads} this week` },
    { label: "Organizations", value: t.organizations },
    { label: "Documents", value: t.documents },
    { label: "Scan results", value: t.scan_results, sub: `+${w.scans} this week` },
    { label: "Score snapshots", value: t.score_snapshots },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
              {s.label}
            </p>
            <p className="mt-1.5 font-display text-3xl font-bold tabular-nums text-text">
              {s.value}
            </p>
            {s.sub && <p className="mt-1 text-xs text-good">{s.sub}</p>}
          </Card>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Last 14 days</p>
            <h2 className="font-display text-lg font-semibold text-text">
              Platform activity
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
            <Badge tone={data.mode === "live" ? "good" : "neutral"}>
              mode: {data.mode}
            </Badge>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={data.timeseries} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeOpacity={0.08} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => d.slice(5)}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="currentColor" strokeOpacity={0.2} />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--surface))",
                  border: "1px solid rgba(148,163,184,0.2)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <p className="eyebrow mb-3">AI providers</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.providers).map(([name, m]) => (
            <Badge key={name} tone={m === "live" ? "good" : "neutral"}>
              {name}: {m}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------- Tables ------------------------------- */

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b text-left">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/50">{children}</tbody>
      </table>
    </Card>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 rounded-card" />
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}

function LeadsTab() {
  const { data, loading, error } = useApiData(() => platformApi.leads(), []);
  if (loading) return <PanelSkeleton />;
  if (error) return <Card className="p-8"><EmptyState title="Couldn't load leads" description={error} /></Card>;
  if (!data?.length)
    return <Card className="p-8"><EmptyState title="No waitlist signups yet" description="Leads from the landing page will appear here." /></Card>;
  return (
    <Table head={["Email", "Source", "Signed up"]}>
      {data.map((l) => (
        <tr key={l.id}>
          <td className="px-4 py-3 font-medium text-text">{l.email}</td>
          <td className="px-4 py-3"><Badge tone="neutral">{l.source}</Badge></td>
          <td className="px-4 py-3 text-muted">{formatDate(l.created_at)}</td>
        </tr>
      ))}
    </Table>
  );
}

function UsersTab() {
  const { data, loading, error } = useApiData(() => platformApi.users(), []);
  if (loading) return <PanelSkeleton />;
  if (error) return <Card className="p-8"><EmptyState title="Couldn't load users" description={error} /></Card>;
  return (
    <Table head={["Email", "Name", "Organizations", "Role", "Joined"]}>
      {(data ?? []).map((u) => (
        <tr key={u.id}>
          <td className="px-4 py-3 font-medium text-text">{u.email}</td>
          <td className="px-4 py-3 text-muted">{u.full_name || "—"}</td>
          <td className="px-4 py-3 text-muted">{u.organizations.join(", ") || "—"}</td>
          <td className="px-4 py-3">
            {u.is_superuser ? <Badge tone="brand">superuser</Badge>
              : u.is_staff ? <Badge tone="neutral">staff</Badge>
              : <span className="text-muted">member</span>}
          </td>
          <td className="px-4 py-3 text-muted">{formatDate(u.date_joined)}</td>
        </tr>
      ))}
    </Table>
  );
}

function OrgsTab() {
  const { data, loading, error } = useApiData(() => platformApi.organizations(), []);
  if (loading) return <PanelSkeleton />;
  if (error) return <Card className="p-8"><EmptyState title="Couldn't load organizations" description={error} /></Card>;
  return (
    <Table head={["Name", "Plan", "Members", "Documents", "Scans", "Created"]}>
      {(data ?? []).map((o) => (
        <tr key={o.id}>
          <td className="px-4 py-3">
            <p className="font-medium text-text">{o.name}</p>
            <p className="font-mono text-xs text-muted">{o.slug}</p>
          </td>
          <td className="px-4 py-3"><Badge tone="neutral">{o.plan}</Badge></td>
          <td className="px-4 py-3 tabular-nums text-muted">{o.members}</td>
          <td className="px-4 py-3 tabular-nums text-muted">{o.documents_count}</td>
          <td className="px-4 py-3 tabular-nums text-muted">{o.scans}</td>
          <td className="px-4 py-3 text-muted">{formatDate(o.created_at)}</td>
        </tr>
      ))}
    </Table>
  );
}

function AuditTab() {
  const { data, loading, error } = useApiData(() => platformApi.audit(), []);
  if (loading) return <PanelSkeleton />;
  if (error) return <Card className="p-8"><EmptyState title="Couldn't load audit log" description={error} /></Card>;
  if (!data?.length)
    return <Card className="p-8"><EmptyState title="No audit events yet" description="Security-relevant actions (registrations, invites, scans…) appear here." /></Card>;
  return (
    <Table head={["Action", "User", "Organization", "Details", "When"]}>
      {data.map((a) => (
        <tr key={a.id}>
          <td className="px-4 py-3"><Badge tone="neutral">{a.action}</Badge></td>
          <td className="px-4 py-3 text-muted">{a.user_email || "—"}</td>
          <td className="px-4 py-3 text-muted">{a.organization_name || "—"}</td>
          <td className="max-w-55 truncate px-4 py-3 font-mono text-xs text-muted">
            {Object.keys(a.meta).length ? JSON.stringify(a.meta) : "—"}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(a.created_at)}</td>
        </tr>
      ))}
    </Table>
  );
}
