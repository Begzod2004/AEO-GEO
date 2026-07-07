import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { apiError } from "@/lib/http";

/** Landing page for the emailed reset link (?uid=...&token=...). */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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
      await authApi.resetPassword({ uid, token, password });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setError(
        apiError(err, "This reset link is invalid or has expired. Request a new one."),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!uid || !token) {
    return (
      <AuthLayout>
        <p className="eyebrow mb-2">Reset password</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Invalid reset link
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          This page needs the link from your reset email.
        </p>
        <p className="mt-6 text-sm text-muted">
          <Link to="/forgot-password" className="font-medium text-brand hover:underline">
            Request a new link
          </Link>
        </p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <p className="eyebrow mb-2">Reset password</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Password updated ✓
        </h1>
        <p className="mt-1.5 text-sm text-muted">Taking you to sign in…</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="eyebrow mb-2">Reset password</p>
      <h1 className="font-display text-2xl font-bold tracking-tight text-text">
        Choose a new password
      </h1>

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
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
