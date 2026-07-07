import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api";
import { apiError } from "@/lib/http";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(apiError(err, "Couldn't send the reset link. Try again."));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <p className="eyebrow mb-2">Reset password</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-text">
          Check your inbox
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          If an account exists for{" "}
          <span className="font-medium text-text">{email}</span>, we&apos;ve sent
          a reset link. It&apos;s valid for 1 hour.
        </p>
        <p className="mt-6 text-sm text-muted">
          <Link to="/login" className="font-medium text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <p className="eyebrow mb-2">Reset password</p>
      <h1 className="font-display text-2xl font-bold tracking-tight text-text">
        Forgot your password?
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Enter your email and we&apos;ll send you a link to set a new one.
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
          label="Email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Remembered it?{" "}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
