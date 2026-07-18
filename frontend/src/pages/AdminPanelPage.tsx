import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useApiData } from "@/hooks/useApiData";
import { platformApi } from "@/lib/api";
import { apiError, backendUrl } from "@/lib/http";
import { formatDate } from "@/lib/format";
import type { PlatformLead } from "@/types/api";

type Tab = "overview" | "issues" | "leads" | "users" | "orgs" | "audit";

/** Super Admin panel — monitor the platform AND fix problems from here:
 *  retry failed work, block users, change plans, dispatch scans. */
export function AdminPanelPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const issuesQuery = useApiData(() => platformApi.issues(), []);
  const issueCount = issuesQuery.data?.count ?? 0;

  const tabs: { value: Tab; label: React.ReactNode }[] = [
    { value: "overview", label: "Overview" },
    {
      value: "issues",
      label: (
        <span className="flex items-center gap-1.5">
          Issues
          {issueCount > 0 && (
            <span className="rounded-full bg-poor/15 px-1.5 font-mono text-[11px] font-bold text-poor">
              {issueCount}
            </span>
          )}
        </span>
      ),
    },
    { value: "leads", label: "Waitlist" },
    { value: "users", label: "Users" },
    { value: "orgs", label: "Organizations" },
    { value: "audit", label: "Audit" },
  ];

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
              href={backendUrl("/admin/")}
              target="_blank"
              rel="noreferrer"
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
          segments={tabs}
          value={tab}
          onChange={setTab}
          ariaLabel="Admin sections"
          className="mb-8 max-w-full overflow-x-auto"
        />
        {tab === "overview" && <OverviewTab />}
        {tab === "issues" && (
          <IssuesTab query={issuesQuery} />
        )}
        {tab === "leads" && <LeadsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "orgs" && <OrgsTab />}
        {tab === "audit" && <AuditTab />}
      </main>
    </div>
  );
}

/* ------------------------------ shared bits ------------------------------ */

function PanelSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 rounded-card" />
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b text-left">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-muted"
              >
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

function healthTone(v: string) {
  return v === "ok" ? "good" : "poor";
}

/* ------------------------------- Overview ------------------------------- */

function OverviewTab() {
  const toast = useToast();
  const overview = useApiData(() => platformApi.overview(), []);
  const health = useApiData(() => platformApi.health(), []);
  const [refreshing, setRefreshing] = useState(false);

  async function refreshScores() {
    setRefreshing(true);
    try {
      await platformApi.action({ action: "refresh_all_scores" });
      toast.success("Score refresh dispatched", "All organizations will recompute shortly.");
    } catch (err) {
      toast.error("Couldn't dispatch refresh", apiError(err));
    } finally {
      setRefreshing(false);
    }
  }

  if (overview.loading) return <PanelSkeleton />;
  if (overview.error || !overview.data)
    return (
      <Card className="p-8">
        <EmptyState title="Couldn't load stats" description={overview.error ?? ""} />
      </Card>
    );

  const data = overview.data;
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
      {/* system health + quick fix actions */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">System</span>
          {health.loading && <Skeleton className="h-6 w-64 rounded-pill" />}
          {health.data &&
            (
              [
                ["database", "Postgres"],
                ["redis_cache", "Redis"],
                ["qdrant", "Qdrant"],
                ["celery_worker", "Celery"],
              ] as const
            ).map(([key, label]) => (
              <Badge key={key} tone={healthTone(health.data![key])} dot>
                {label}
              </Badge>
            ))}
          {health.data && (
            <Badge tone={data.mode === "live" ? "good" : "neutral"}>
              AI mode: {data.mode}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => { overview.refetch(false); health.refetch(false); }}>
            Refresh
          </Button>
          <Button size="sm" loading={refreshing} onClick={refreshScores}>
            Recompute all scores
          </Button>
        </div>
      </Card>

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

      {/* growth and scans get separate charts — scan volume would otherwise
          flatten the signup/lead lines into invisibility */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityChart
          title="Growth"
          subtitle="Signups & waitlist · last 14 days"
          data={data.timeseries}
          series={[
            { key: "signups", label: "Signups", color: "#7C6BFF" },
            { key: "leads", label: "Waitlist", color: "#2DD4BF" },
          ]}
        />
        <ActivityChart
          title="Usage"
          subtitle="Scan results · last 14 days"
          data={data.timeseries}
          series={[{ key: "scans", label: "Scans", color: "#F59E0B" }]}
        />
      </div>

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

function ActivityChart({
  title,
  subtitle,
  data,
  series,
}: {
  title: string;
  subtitle: string;
  data: { date: string }[];
  series: { key: string; label: string; color: string }[];
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
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
            {series.map((s) => (
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
  );
}

/* -------------------------------- Issues -------------------------------- */

const RETRY_ACTION: Record<string, string> = {
  document: "retry_document",
  crawl: "retry_crawl",
  schema: "retry_schema",
};

function IssuesTab({
  query,
}: {
  query: ReturnType<typeof useApiData<Awaited<ReturnType<typeof platformApi.issues>>>>;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function retry(kind: string, id: number) {
    const key = `${kind}-${id}`;
    setBusy(key);
    try {
      const res = await platformApi.action({ action: RETRY_ACTION[kind], id });
      toast.success("Re-queued", res.detail ?? "The job was dispatched again.");
      await query.refetch(false);
    } catch (err) {
      toast.error("Retry failed", apiError(err));
    } finally {
      setBusy(null);
    }
  }

  if (query.loading) return <PanelSkeleton />;
  const items = query.data?.items ?? [];
  if (!items.length)
    return (
      <Card className="p-8">
        <EmptyState
          title="No issues 🎉"
          description="Failed documents, crawls and schema generations will show up here with a retry button."
        />
      </Card>
    );

  return (
    <Table head={["Type", "What", "Organization", "Error", "When", ""]}>
      {items.map((it) => (
        <tr key={`${it.kind}-${it.id}`}>
          <td className="px-4 py-3">
            <Badge tone="poor">{it.kind}</Badge>
          </td>
          <td className="px-4 py-3 font-medium text-text">{it.title}</td>
          <td className="px-4 py-3 text-muted">{it.organization}</td>
          <td className="max-w-60 truncate px-4 py-3 font-mono text-xs text-poor/90" title={it.error}>
            {it.error || "—"}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(it.when)}</td>
          <td className="px-4 py-3 text-right">
            <Button
              size="sm"
              loading={busy === `${it.kind}-${it.id}`}
              onClick={() => retry(it.kind, it.id)}
            >
              Retry
            </Button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

/* -------------------------------- Leads --------------------------------- */

function exportLeadsCsv(leads: PlatformLead[]) {
  const rows = [
    ["email", "source", "signed_up"],
    ...leads.map((l) => [l.email, l.source, l.created_at]),
  ];
  const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "aeo-geo-waitlist.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function LeadsTab() {
  const { data, loading, error } = useApiData(() => platformApi.leads(), []);
  if (loading) return <PanelSkeleton />;
  if (error)
    return <Card className="p-8"><EmptyState title="Couldn't load leads" description={error} /></Card>;
  if (!data?.length)
    return (
      <Card className="p-8">
        <EmptyState title="No waitlist signups yet" description="Leads from the landing page will appear here." />
      </Card>
    );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {data.length} signup{data.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" variant="ghost" onClick={() => exportLeadsCsv(data)}>
          Export CSV
        </Button>
      </div>
      <Table head={["Email", "Source", "Signed up"]}>
        {data.map((l) => (
          <tr key={l.id}>
            <td className="px-4 py-3 font-medium text-text">{l.email}</td>
            <td className="px-4 py-3"><Badge tone="neutral">{l.source}</Badge></td>
            <td className="px-4 py-3 text-muted">{formatDate(l.created_at)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* -------------------------------- Users --------------------------------- */

function UsersTab() {
  const toast = useToast();
  const { data, loading, error, refetch } = useApiData(() => platformApi.users(), []);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<number | string | null>(null);

  const filtered = useMemo(() => {
    const list = data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (u) =>
        u.email.toLowerCase().includes(needle) ||
        (u.full_name ?? "").toLowerCase().includes(needle) ||
        u.organizations.some((o) => o.toLowerCase().includes(needle)),
    );
  }, [data, q]);

  async function toggleActive(id: number | string) {
    setBusy(id);
    try {
      const res = await platformApi.action({ action: "toggle_user_active", id });
      toast.success(res.is_active ? "User unblocked" : "User blocked");
      await refetch(false);
    } catch (err) {
      toast.error("Couldn't update user", apiError(err));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <PanelSkeleton />;
  if (error)
    return <Card className="p-8"><EmptyState title="Couldn't load users" description={error} /></Card>;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by email, name or organization…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search users"
        className="max-w-md"
      />
      <Table head={["Email", "Name", "Organizations", "Role", "Status", "Joined", ""]}>
        {filtered.map((u) => {
          const active = (u as { is_active?: boolean }).is_active !== false;
          return (
            <tr key={u.id} className={!active ? "opacity-60" : undefined}>
              <td className="px-4 py-3 font-medium text-text">{u.email}</td>
              <td className="px-4 py-3 text-muted">{u.full_name || "—"}</td>
              <td className="px-4 py-3 text-muted">{u.organizations.join(", ") || "—"}</td>
              <td className="px-4 py-3">
                {u.is_superuser ? (
                  <Badge tone="brand">superuser</Badge>
                ) : u.is_staff ? (
                  <Badge tone="neutral">staff</Badge>
                ) : (
                  <span className="text-muted">member</span>
                )}
              </td>
              <td className="px-4 py-3">
                {active ? <Badge tone="good" dot>active</Badge> : <Badge tone="poor" dot>blocked</Badge>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(u.date_joined)}</td>
              <td className="px-4 py-3 text-right">
                {!u.is_superuser && (
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busy === u.id}
                    onClick={() => toggleActive(u.id)}
                  >
                    {active ? "Block" : "Unblock"}
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

/* ---------------------------- Organizations ----------------------------- */

const PLANS = ["starter", "pro", "business", "enterprise"];

function OrgsTab() {
  const toast = useToast();
  const { data, loading, error, refetch } = useApiData(() => platformApi.organizations(), []);
  const [busy, setBusy] = useState<string | null>(null);

  async function setPlan(id: number | string, plan: string) {
    setBusy(`plan-${id}`);
    try {
      await platformApi.action({ action: "set_org_plan", id, plan });
      toast.success("Plan updated", `Organization moved to ${plan}.`);
      await refetch(false);
    } catch (err) {
      toast.error("Couldn't change plan", apiError(err));
    } finally {
      setBusy(null);
    }
  }

  async function runScan(id: number | string) {
    setBusy(`scan-${id}`);
    try {
      await platformApi.action({ action: "run_org_scan", id });
      toast.success("Scan dispatched", "Fresh results will appear on their dashboard.");
    } catch (err) {
      toast.error("Couldn't dispatch scan", apiError(err));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <PanelSkeleton />;
  if (error)
    return <Card className="p-8"><EmptyState title="Couldn't load organizations" description={error} /></Card>;

  return (
    <Table head={["Name", "Plan", "Members", "Documents", "Scans", "Created", ""]}>
      {(data ?? []).map((o) => (
        <tr key={o.id}>
          <td className="px-4 py-3">
            <p className="font-medium text-text">{o.name}</p>
            <p className="font-mono text-xs text-muted">{o.slug}</p>
          </td>
          <td className="px-4 py-3">
            <Select
              aria-label={`Plan for ${o.name}`}
              value={o.plan}
              disabled={busy === `plan-${o.id}`}
              onChange={(e) => setPlan(o.id, e.target.value)}
              className="h-8 w-32"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </td>
          <td className="px-4 py-3 tabular-nums text-muted">{o.members}</td>
          <td className="px-4 py-3 tabular-nums text-muted">{o.documents_count}</td>
          <td className="px-4 py-3 tabular-nums text-muted">{o.scans}</td>
          <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(o.created_at)}</td>
          <td className="px-4 py-3 text-right">
            <Button
              size="sm"
              variant="ghost"
              loading={busy === `scan-${o.id}`}
              onClick={() => runScan(o.id)}
            >
              Run scan
            </Button>
          </td>
        </tr>
      ))}
    </Table>
  );
}

/* -------------------------------- Audit --------------------------------- */

function AuditTab() {
  const { data, loading, error } = useApiData(() => platformApi.audit(), []);
  if (loading) return <PanelSkeleton />;
  if (error)
    return <Card className="p-8"><EmptyState title="Couldn't load audit log" description={error} /></Card>;
  if (!data?.length)
    return (
      <Card className="p-8">
        <EmptyState
          title="No audit events yet"
          description="Security-relevant actions (registrations, invites, scans, admin actions…) appear here."
        />
      </Card>
    );
  return (
    <Table head={["Action", "User", "Organization", "Details", "When"]}>
      {data.map((a) => (
        <tr key={a.id}>
          <td className="px-4 py-3">
            <Badge tone={a.action.startsWith("platform.") ? "brand" : "neutral"}>
              {a.action}
            </Badge>
          </td>
          <td className="px-4 py-3 text-muted">{a.user_email || "—"}</td>
          <td className="px-4 py-3 text-muted">{a.organization_name || "—"}</td>
          <td className="max-w-55 truncate px-4 py-3 font-mono text-xs text-muted">
            {Object.keys(a.meta).length ? JSON.stringify(a.meta) : "—"}
          </td>
          <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(a.created_at)}</td>
        </tr>
      ))}
    </Table>
  );
}
