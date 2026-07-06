import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { apiError } from "@/lib/http";

/** Invited teammates land here from their invite link (?token=...) to choose a
 *  password and activate the account. One-time: a used/expired token is
 *  rejected by the backend. */
export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.acceptInvite({ token, password });
      setEmail(res.email);
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setError(
        apiError(err, "This invite link is invalid or has expired. Ask for a new one."),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <p className="eyebrow mb-2">Team invite</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Missing invite token
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          This page needs the invite link you received. Ask your organization
          admin to send it again.
        </p>
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  if (email) {
    return (
      <AuthLayout>
        <p className="eyebrow mb-2">Team invite</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          You&apos;re all set ✓
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Password saved for <span className="font-medium text-text">{email}</span>.
          Taking you to sign in…
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="eyebrow mb-2">Team invite</p>
      <h1 className="font-display text-2xl font-bold tracking-tight text-text">
        Join your team on AEO.GEO
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Choose a password to activate your account.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="rounded-control border border-poor/30 bg-poor/10 px-3.5 py-2.5 text-sm text-poor"
          >
            {error}
          </div>
        )}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repeat the password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Activate account
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already activated?{" "}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
