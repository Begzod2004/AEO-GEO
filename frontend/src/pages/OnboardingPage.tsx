import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { IconBuilding, IconCheck, IconGlobe, IconPlus } from "@/components/ui/icons";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { orgApi } from "@/lib/api";
import { apiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import type { Domain } from "@/types/api";

const INDUSTRIES = [
  "SaaS",
  "E-commerce",
  "Fintech",
  "Healthcare",
  "Education",
  "Marketing agency",
  "Media",
  "Other",
];

export function OnboardingPage() {
  const { user } = useAuth();
  const { orgs, currentOrg, selectOrg, refresh, loading } = useOrg();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [creating, setCreating] = useState(false);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainUrl, setDomainUrl] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainsLoading, setDomainsLoading] = useState(false);

  useEffect(() => {
    if (!currentOrg) {
      setDomains([]);
      return;
    }
    let active = true;
    setDomainsLoading(true);
    orgApi
      .domains(currentOrg.id)
      .then((d) => active && setDomains(d))
      .catch(() => active && setDomains([]))
      .finally(() => active && setDomainsLoading(false));
    return () => {
      active = false;
    };
  }, [currentOrg]);

  async function createOrg(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const org = await orgApi.create({ name: name.trim(), industry: industry || undefined });
      await refresh();
      selectOrg(org.id);
      setName("");
      setIndustry("");
      toast.success("Organization created", `${org.name} is ready.`);
    } catch (err) {
      toast.error("Couldn't create organization", apiError(err));
    } finally {
      setCreating(false);
    }
  }

  async function addDomain(e: FormEvent) {
    e.preventDefault();
    if (!currentOrg || !domainUrl.trim()) return;
    setAddingDomain(true);
    try {
      const d = await orgApi.addDomain(currentOrg.id, { url: domainUrl.trim(), is_primary: isPrimary });
      setDomains((prev) => [...prev, d]);
      setDomainUrl("");
      toast.success("Domain added", d.url);
    } catch (err) {
      toast.error("Couldn't add domain", apiError(err));
    } finally {
      setAddingDomain(false);
    }
  }

  const hasOrgs = orgs.length > 0;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          {user?.is_superuser && (
            <Link
              to="/admin"
              className="mb-4 inline-flex items-center gap-2 rounded-control border border-brand/30 bg-brand/10 px-3.5 py-2 text-sm font-medium text-brand hover:bg-brand/15"
            >
              ◈ Open Platform admin
            </Link>
          )}
          <p className="eyebrow mb-1.5">Set up your workspace</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {hasOrgs ? "Your organizations" : "Create your first organization"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            An organization is the brand you track — its prompts, documents and scores live here.
            Add a website domain so we can measure your search and answer-engine health.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Left: orgs list + create */}
          <div className="space-y-6">
            <Card className="p-5">
              <CardHeader eyebrow="Organizations" title="Choose one to work in" />
              <div className="mt-4 space-y-2">
                {loading && orgs.length === 0 ? (
                  <div className="flex items-center gap-2 px-1 py-4 text-sm text-muted">
                    <Spinner /> Loading…
                  </div>
                ) : hasOrgs ? (
                  orgs.map((o) => {
                    const active = currentOrg?.id === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => selectOrg(o.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-control border px-3 py-3 text-left transition-colors",
                          active ? "border-brand/50 bg-brand/5" : "hover:bg-surface-2/50",
                        )}
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-brand/12 text-brand">
                          <IconBuilding className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-text">{o.name}</span>
                          <span className="block truncate text-xs text-muted">
                            {o.industry || "No industry set"}
                          </span>
                        </span>
                        {active && (
                          <Badge tone="brand" dot>
                            Selected
                          </Badge>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={<IconBuilding />}
                    title="No organizations yet"
                    description="Create one to start tracking your AI visibility."
                  />
                )}
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader eyebrow="New organization" title="Add an organization" />
              <form onSubmit={createOrg} className="mt-4 space-y-4">
                <Input
                  label="Name"
                  required
                  placeholder="Northwind Labs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label htmlFor="industry" className="block text-sm font-medium text-text">
                    Industry
                  </label>
                  <div className="flex flex-wrap gap-2" id="industry">
                    {INDUSTRIES.map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setIndustry((cur) => (cur === opt ? "" : opt))}
                        className={cn(
                          "rounded-pill border px-3 py-1.5 text-sm transition-colors",
                          industry === opt
                            ? "border-brand/50 bg-brand/10 text-brand"
                            : "text-muted hover:bg-surface-2/60 hover:text-text",
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" loading={creating} iconLeft={<IconPlus className="h-4 w-4" />}>
                  Create organization
                </Button>
              </form>
            </Card>
          </div>

          {/* Right: domains for the selected org */}
          <div className="space-y-6">
            <Card className="p-5">
              <CardHeader
                eyebrow="Domains"
                title={currentOrg ? `Domains for ${currentOrg.name}` : "Domains"}
              />
              {!currentOrg ? (
                <p className="mt-4 text-sm text-muted">Select or create an organization first.</p>
              ) : (
                <>
                  <div className="mt-4 space-y-2">
                    {domainsLoading ? (
                      <div className="flex items-center gap-2 py-3 text-sm text-muted">
                        <Spinner /> Loading domains…
                      </div>
                    ) : domains.length === 0 ? (
                      <p className="rounded-control border border-dashed px-3 py-4 text-sm text-muted">
                        No domains yet. Add your primary website below.
                      </p>
                    ) : (
                      domains.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 rounded-control border px-3 py-2.5"
                        >
                          <IconGlobe className="h-4 w-4 shrink-0 text-muted" />
                          <span className="min-w-0 flex-1 truncate text-sm text-text">{d.url}</span>
                          {d.is_primary && (
                            <Badge tone="brand">
                              <IconCheck className="h-3 w-3" />
                              Primary
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={addDomain} className="mt-4 space-y-3 border-t pt-4">
                    <Input
                      label="Website URL"
                      type="url"
                      required
                      placeholder="https://yourbrand.com"
                      iconLeft={<IconGlobe />}
                      value={domainUrl}
                      onChange={(e) => setDomainUrl(e.target.value)}
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="h-4 w-4 rounded border-line accent-[rgb(var(--brand))]"
                      />
                      Set as primary domain
                    </label>
                    <Button
                      type="submit"
                      variant="secondary"
                      loading={addingDomain}
                      iconLeft={<IconPlus className="h-4 w-4" />}
                    >
                      Add domain
                    </Button>
                  </form>
                </>
              )}
            </Card>

            <div className="flex justify-end">
              <Button
                size="lg"
                disabled={!currentOrg}
                onClick={() => navigate("/")}
                iconRight={
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                }
              >
                Continue to dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
