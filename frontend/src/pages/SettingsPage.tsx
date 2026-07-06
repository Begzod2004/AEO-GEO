import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { IconBuilding, IconCheck, IconGlobe } from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { useToast } from "@/context/ToastContext";
import { orgApi } from "@/lib/api";
import { apiError } from "@/lib/http";
import type { Domain, Membership, OrgRole } from "@/types/api";

const ROLES: OrgRole[] = [
  "org_admin",
  "marketing_manager",
  "aeo_specialist",
  "content_manager",
  "writer",
  "developer",
  "billing_manager",
  "viewer",
];

function roleLabel(role: string) {
  return role.replace(/_/g, " ");
}

export function SettingsPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const orgId = currentOrg!.id;
  const toast = useToast();

  const [members, setMembers] = useState<Membership[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("viewer");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      orgApi.members(orgId).catch(() => [] as Membership[]),
      orgApi.domains(orgId).catch(() => [] as Domain[]),
    ]).then(([m, d]) => {
      if (!active) return;
      setMembers(m);
      setDomains(d);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [orgId]);

  async function invite(e: FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await orgApi.invite(orgId, { email: inviteEmail.trim(), role: inviteRole });
      toast.success("Invitation sent", `${inviteEmail} was invited as ${roleLabel(inviteRole)}.`);
      setInviteEmail("");
    } catch (err) {
      toast.error("Couldn't send invite", apiError(err));
    } finally {
      setInviting(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Settings" description="Manage your account, organization and team." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account */}
        <Card className="p-5 sm:p-6">
          <CardHeader eyebrow="Account" title="Your profile" />
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Name</dt>
              <dd className="font-medium text-text">{user?.full_name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="truncate font-medium text-text">{user?.email}</dd>
            </div>
          </dl>
        </Card>

        {/* Appearance */}
        <Card className="p-5 sm:p-6">
          <CardHeader eyebrow="Appearance" title="Theme" />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted">Switch between the dark observatory and light daylight themes.</p>
            <ThemeToggle />
          </div>
        </Card>

        {/* Organization */}
        <Card className="p-5 sm:p-6">
          <CardHeader
            eyebrow="Organization"
            title={currentOrg?.name ?? "Organization"}
            action={
              <Link to="/onboarding" className="text-sm font-medium text-brand hover:underline">
                Manage
              </Link>
            }
          />
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Industry</dt>
              <dd className="font-medium text-text">{currentOrg?.industry || "—"}</dd>
            </div>
            {currentOrg?.plan && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Plan</dt>
                <dd>
                  <Badge tone="brand" className="capitalize">
                    {currentOrg.plan}
                  </Badge>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-4 border-t pt-4">
            <p className="eyebrow mb-2">Domains</p>
            {loading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted">
                <Spinner /> Loading…
              </div>
            ) : domains.length === 0 ? (
              <p className="text-sm text-muted">No domains yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {domains.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-sm">
                    <IconGlobe className="h-4 w-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate text-text">{d.url}</span>
                    {d.is_primary && (
                      <Badge tone="brand">
                        <IconCheck className="h-3 w-3" /> Primary
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Team */}
        <Card className="p-5 sm:p-6">
          <CardHeader eyebrow="Team" title="Members" />
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted">
                <Spinner /> Loading…
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted">No members loaded.</p>
            ) : (
              members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-control border px-3 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
                    {(m.user.full_name || m.user.email || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text">{m.user.full_name || m.user.email}</p>
                    <p className="truncate text-xs text-muted">{m.user.email}</p>
                  </div>
                  <Badge tone="neutral" className="capitalize">
                    {roleLabel(m.role)}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <form onSubmit={invite} className="mt-4 space-y-3 border-t pt-4">
            <p className="eyebrow flex items-center gap-1.5">
              <IconBuilding className="h-3.5 w-3.5" /> Invite a teammate
            </p>
            <Input
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <Select
                aria-label="Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                className="flex-1 capitalize"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary" loading={inviting}>
                Invite
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
